const async = require('async')
const spawn = require('child_process').spawn
const debug = require('debug')('mutode')
const del = require('del')
const fs = require('fs')
const globby = require('globby')
const mkdirp = require('mkdirp')
const os = require('os')
const path = require('path')
const copyDir = require('recursive-copy')
const stripAnsiStream = require('strip-ansi-stream')
const {promisify} = require('util')

const readFile = promisify(fs.readFile)
console.logSame = (t) => process.stdout.write(t)

/**
 * Mutode main class
 */
class Mutode {
  /**
   * Create a new Mutode instance
   * @param paths {array} - Paths or files to mutate
   * @param concurrency {number} - Number of concurrent workers
   */
  constructor ({paths = ['src/*'], concurrency = os.cpus().length}) {
    Mutode.mkdir()
    this.filePaths = globby.sync(paths)
    if (this.filePaths.length === 0) {
      throw new Error('No files found in the specified paths')
    }
    debug('Config:\n\tFile paths %o\n\tConcurrency: %s', this.filePaths, concurrency)

    this.mutants = 0
    this.killed = 0
    this.survivors = 0
    this.discarded = 0
    this.coverage = 0
    this.mutators = []
    this.concurrency = concurrency
    this.workers = {}
    for (let i = 0; i < this.concurrency; i++) {
      this.workers[i] = true
    }
    this.ready = false

    this.loadMutants()

    const mutantsLogFile = fs.createWriteStream(path.resolve('./.mutode/mutants.log'), {flags: 'w'})
    this.mutantLog = string => mutantsLogFile.write(string + '\n')
    const logFile = fs.createWriteStream(path.resolve('./.mutode/mutode.log'), {flags: 'w'})
    const stream = stripAnsiStream()

    stream.pipe(logFile)

    process.stdout.write = (function (write) {
      return function (string, encoding, fd) {
        write.apply(process.stdout, arguments)
        stream.write(string)
      }
    })(process.stdout.write)
  }

  /**
   * Run current instance
   * @returns {Promise} - Promise that resolves once this instance's execution is completed.
   */
  async run () {
    try {
      await Mutode.delete()
      await Mutode.copyFirst()
      this.timeout = await Mutode.timeCleanTests()
      this.copied = Mutode.copy(this.concurrency)
      await new Promise((resolve, reject) => {
        async.eachSeries(this.filePaths, this.fileProcessor(), this.done(resolve, reject))
      })
    } catch (e) {
      console.error(e.message)
    } finally {
      await Mutode.delete()
    }
  }

  fileProcessor () {
    return async filePath => {
      debug('Creating mutants for %s', filePath)

      const queue = async.queue(async task => {
        const i = await this.freeQueue()
        debug('Running task in worker %d', i)
        await task(i)
        this.workers[i] = true
        debug('Finished running task in worker %d', i)
      }, this.concurrency)

      if (!this.ready) {
        debug('Queue paused')
        queue.pause()
        this.copied.then(() => {
          debug('Queue resumed %s', queue.length())
          queue.resume()
        })
      }

      const fileContent = (await readFile(filePath)).toString()
      const lines = fileContent.split('\n')
      for (const mutator of this.mutators) {
        debug('Running mutator %s', mutator.name)
        await mutator({mutodeInstance: this, filePath, lines, queue})
      }
      await new Promise(resolve => {
        debug('Adding drain function to queue %d', queue.length())
        queue.drain = () => {
          debug(`Finished %s`, filePath)
          for (let i = 0; i < this.concurrency; i++) {
            fs.writeFileSync(`.mutode/mutode-${i}/${filePath}`, fileContent) // Reset file to original content
          }
          console.log()
          resolve()
        }
      })
    }
  }

  /**
   * Promise handler that returns a function that runs when mutants execution is completed.
   * @param resolve - Promise resolve handler
   * @param reject - Promise reject handler
   * @returns {function} - Function that runs when mutants execution is completed.
   */
  done (resolve, reject) {
    return err => {
      if (err) {
        console.error(err)
        reject(err)
      }
      console.log(`Out of ${this.mutants} mutants, ${this.killed} were killed, ${this.survivors} survived and ${this.discarded} were discarded`)
      this.coverage = +(this.killed / this.mutants * 100).toFixed(2)
      console.log(`Mutant coverage: ${this.coverage}%`)
      // process.exit()
      resolve()
    }
  }

  /**
   * Function that returns the index of the first worker that is free.
   */
  async freeQueue () {
    for (let i = 0; i < this.concurrency; i++) {
      if (this.workers[i]) {
        this.workers[i] = false
        return i
      }
    }
  }

  /**
   * Times the AUT's test suite execution.
   * @returns {Promise} - Promise that resolves once AUT's test suite execution is completed.
   */
  static async timeCleanTests () {
    console.log(`Verifying and timing your test suite`)
    const start = +new Date()
    const child = spawn('npm', ['test'], {cwd: path.resolve('.mutode/mutode-0')})

    setTimeout(() => {
      child.connected && child.disconnect()
    }, 60000).unref()

    return new Promise((resolve, reject) => {
      child.on('exit', code => {
        if (code !== 0) reject(new Error('Test suite most exit with code 0 with no mutants for Mutode to continue'))
        const diff = +new Date() - start
        const timeout = Math.max(diff * 2, 5000)
        console.log(`Took ${(diff / 1000).toFixed(2)} seconds to run full test suite\n`)
        resolve(timeout)
      })
    })
  }

  /**
   * Synchronous load of mutators.
   */
  loadMutants () {
    console.logSame('Loading mutators... ')
    const mutatorsPath = path.resolve(__dirname, 'mutators/')
    fs.readdirSync(mutatorsPath).forEach(file => {
      const filePath = path.join(mutatorsPath, file)
      let mutant = filePath.replace(mutatorsPath, '').replace('/', '').replace('.js', '')
      let requireFilePath = path.resolve(filePath)
      this.mutators.push(require(requireFilePath))
      debug('Loaded mutant %s', mutant)
    })
    console.log('Done\n')
  }

  /**
   * Creates a an exact copy of the AUT.
   * @returns {Promise} - Promise that resolves once the copy is created.
   */
  static async copyFirst () {
    console.logSame(`Creating a copy of your module... `)
    await copyDir('./', `.mutode/mutode-0`)
    console.log('Done\n')
  }

  /**
   * Creates <i>this.concurrency<i/> exact copies of the AUT.
   * @returns {Promise} - Promise that resolves once the copies are created.
   */
  static async copy (copies) {
    console.logSame(`Creating ${copies} extra copies of your module... `)
    for (let i = 1; i < copies; i++) {
      console.logSame(`${i}.. `)
      await copyDir('./', `.mutode/mutode-${i}`)
    }
    this.ready = true
    console.log('Done\n')
  }

  /**
   * Creates the <i>.mutode</i> folder to save logs.
   */
  static mkdir () {
    mkdirp.sync(path.resolve('.mutode'))
  }

  /**
   * Deletes available copies of the AUT.
   * @returns {Promise} - Promise that resolves once copies have been deleted.
   */
  static async delete () {
    const toDelete = await globby('.mutode/mutode-*', {dot: true, onlyDirectories: true})
    if (!toDelete) return
    console.logSame('Deleting copies...')
    for (const path of toDelete) {
      await del(path, {force: true})
    }
    console.log('Done\n')
  }
}

module.exports = Mutode
