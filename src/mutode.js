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
 * Mutode's main class
 */
class Mutode {
  /**
   * Create a new Mutode instance
   * @param opts {Object}
   * @param {array} [opts.paths = [`src/**`]] - Glob matched paths or files to mutate
   * @param {number} [opts.concurrency = # of cpu cores] - Number of concurrent workers
   * @param {array} [opts.mutators = ['*']]- Mutators to load (e.g. *deletion*)
   * @returns {Mutode} - Returns an instance of mutode
   */
  constructor ({paths = ['src/**'], concurrency = os.cpus().length, mutators = ['*']}) {
    Mutode.mkdir()
    this.filePaths = globby.sync(paths)
    if (this.filePaths.length === 0) {
      throw new Error('No files found in the specified paths')
    }
    debug('Config:\n\tFile paths %o\n\tConcurrency: %s', this.filePaths, concurrency)

    this.mutators = mutators
    this.concurrency = concurrency
    this.mutants = 0
    this.killed = 0
    this.survivors = 0
    this.discarded = 0
    this.coverage = 0
    this.workers = {}
    for (let i = 0; i < this.concurrency; i++) {
      this.workers[i] = true
    }
    this.ready = false

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
    if (this.mutants > 0) throw new Error('This instance has already been executed')
    try {
      await Mutode.delete()
      await Mutode.copyFirst()
      this.mutators = await Mutode.loadMutants(this.mutators)
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

  /**
   * Function that returns an async function to process one file binded to the instance scope.
   * @private
   * @returns {function(filePath)} - Async function that runs instance's mutators and executes generated mutants for one file.
   */
  fileProcessor () {
    return async filePath => {
      debug('Creating mutants for %s', filePath)

      const queue = async.queue(async task => {
        const i = await this.freeWorker()
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
   * @private
   * @param resolve {function} - Promise resolve handler
   * @param reject {function} - Promise reject handler
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
   * @private
   */
  async freeWorker () {
    for (let i = 0; i < this.concurrency; i++) {
      if (this.workers[i]) {
        this.workers[i] = false
        return i
      }
    }
  }

  /**
   * Times the AUT's test suite execution.
   * @private
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
   * @private
   * @returns {Promise} - Promise that resolves with the loaded mutators
   */
  static async loadMutants (mutatorsNames) {
    console.logSame('Loading mutators... ')
    let mutatorsPaths = mutatorsNames.map(m => `mutators/${m}Mutator.js`)
    const mutators = []
    const mutatorsPath = path.resolve(__dirname, 'mutators/')
    mutatorsPaths = await globby(mutatorsPaths, {cwd: __dirname, absolute: true})
    for (const mutatorPath of mutatorsPaths) {
      debug('Loaded mutator %s', mutatorPath.replace(mutatorsPath + '/', '').replace('Mutator.js', ''))
      mutators.push(require(path.resolve(mutatorPath)))
    }
    console.log('Done\n')
    return mutators
  }

  /**
   * Creates a an exact copy of the AUT.
   * @private
   * @returns {Promise} - Promise that resolves once the copy is created.
   */
  static async copyFirst () {
    console.logSame(`Creating a copy of your module... `)
    await copyDir('./', `.mutode/mutode-0`)
    console.log('Done\n')
  }

  /**
   * Creates <i>this.concurrency<i/> exact copies of the AUT.
   * @private
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
   * @private
   */
  static mkdir () {
    mkdirp.sync(path.resolve('.mutode'))
  }

  /**
   * Deletes available copies of the AUT.
   * @private
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

/**
 * @module Mutators
 */

module.exports = Mutode
