const async = require('async')
const babylon = require('babylon')
const spawn = require('child_process').spawn
const debug = require('debug')('mutode')
const del = require('del')
const fs = require('fs')
const globby = require('globby')
const mkdirp = require('mkdirp')
const os = require('os')
const path = require('path')
const prettyMs = require('pretty-ms')
const copyDir = require('recursive-copy')
const stripAnsi = require('strip-ansi')
const {promisify} = require('util')

const readFile = promisify(fs.readFile)

/**
 * Mutode's main class
 */
class Mutode {
  /**
   * Create a new Mutode instance
   * @param opts {Object}
   * @param {array<string>} [opts.paths = ['index.js', 'src/']] - Glob matched paths or files to mutate
   * @param {number} [opts.concurrency = # of cpu cores] - Number of concurrent workers
   * @param {array<string>} [opts.mutators = All]- Mutators to load (e.g. *deletion*)
   * @returns {Mutode} - Returns an instance of mutode
   */
  constructor ({paths = [], concurrency = os.cpus().length, mutators = ['*']} = {}) {
    if (!Array.isArray(paths)) paths = [paths]
    if (!Array.isArray(mutators)) mutators = [mutators]
    if (paths.length === 0) paths = ['index.js', 'src/']
    debug('Config:\n\tFile paths %o\n\tConcurrency: %s\n\tMutators: %s', paths, concurrency, mutators)
    Mutode.mkdir()
    this.filePaths = globby.sync(paths)
    debug('Globbed files %o', this.filePaths)
    if (this.filePaths.length === 0) {
      throw new Error('No files found in the specified paths')
    }

    this.id = `${Math.floor(Date.now() / 10000)}`
    this.npmCommand = /^win/.test(process.platform) ? 'npm.cmd' : 'npm'
    this.mutators = mutators
    this.concurrency = concurrency
    this.mutants = 0
    this.killed = 0
    this.survived = 0
    this.discarded = 0
    this.coverage = 0
    this.workers = {}
    for (let i = 0; i < this.concurrency; i++) {
      this.workers[i] = true
    }

    this.mutantsLogFile = fs.createWriteStream(path.resolve(`.mutode/mutants-${this.id}.log`), {flags: 'w'})
    this.logFile = fs.createWriteStream(path.resolve(`.mutode/mutode-${this.id}.log`), {flags: 'w'})
    this.mutantLog = string => this.mutantsLogFile.write(`${stripAnsi(string.trim())}\n`)
    console.logSame = s => {
      process.stdout.write(s)
      this.logFile.write(stripAnsi(s))
    }
    console.log = (s = '') => {
      process.stdout.write(`${s}\n`)
      this.logFile.write(`${stripAnsi(s.toString().trim())}\n`)
    }
  }

  /**
   * Run current instance
   * @returns {Promise} - Promise that resolves once this instance's execution is completed.
   */
  async run () {
    if (this.mutants > 0) throw new Error('This instance has already been executed')
    console.log(`Mutode ${this.id} running`)
    await this.delete()
    const startTime = process.hrtime()
    try {
      await this.copyFirst()
      this.mutators = await Mutode.loadMutants(this.mutators)
      this.timeout = await this.timeCleanTests()
      debug('Setting mutant runner timeout to %s seconds', this.timeout / 1000)
      this.copied = this.copy()
      await new Promise((resolve, reject) => {
        async.eachSeries(this.filePaths, this.fileProcessor(), this.done(resolve, reject))
      })
    } catch (e) {
      debug(e)
      throw e
    } finally {
      await this.delete()
      const endTime = process.hrtime(startTime)
      const endTimeMS = endTime[0] * 1e3 + endTime[1] / 1e6
      console.log(`Mutode ${this.id} finished. Took ${prettyMs(endTimeMS)}`)
      console.log()
      this.mutantsLogFile.end()
      this.logFile.end()
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
      const before = this.mutants

      const queue = async.queue(async task => {
        const i = await this.freeWorker()
        debug('Running task in worker %d', i)
        await task(i)
        this.workers[i] = true
        debug('Finished running task in worker %d', i)
      }, this.concurrency)
      queue.pause()

      this.copied.then(() => {
        console.log(`Running mutants for ${filePath}`)
        queue.resume()
      })

      const fileContent = (await readFile(filePath)).toString()
      const lines = fileContent.split('\n')
      let ast
      try {
        ast = babylon.parse(fileContent)
      } catch (e) {
        try {
          ast = babylon.parse(fileContent, {sourceType: 'module'})
        } catch (e) {
          console.log(`Couldn't parse AST for file ${filePath}`)
          debug(e)
          throw e
        }
      }
      for (const mutator of this.mutators) {
        debug('Running mutator %s', mutator.name)
        const before = this.mutants
        await mutator({mutodeInstance: this, filePath, lines, queue, ast})
        const generated = this.mutants - before
        debug('Mutator %s generated %d mutants', mutator.name, generated)
      }
      const generated = this.mutants - before
      debug('%d mutants generated for %s', generated, filePath)
      await new Promise(resolve => {
        const resolveWhenDone = () => {
          for (let i = 0; i < this.concurrency; i++) {
            fs.writeFileSync(`.mutode/mutode-${this.id}-${i}/${filePath}`, fileContent) // Reset file to original content
          }
          console.log()
          setImmediate(resolve)
        }

        if (queue.length() === 0) {
          return this.copied.then(() => {
            resolveWhenDone()
          })
        }
        debug('Adding drain function to queue %d', queue.length())
        queue.drain = () => {
          debug(`Finished %s`, filePath)
          resolveWhenDone()
        }
      })
    }
  }

  /**
   * Promise handler that returns a function that runs when mutants execution is completed.
   * @private
   * @param resolve {function} - Promise resolve handler
   * @returns {function} - Function that runs when mutants execution is completed.
   */
  done (resolve, reject) {
    return err => {
      if (err) {
        debug(err)
        return reject(err)
      }
      console.log(`Out of ${this.mutants} mutants, ${this.killed} were killed, ${this.survived} survived and ${this.discarded} were discarded`)
      this.coverage = +((this.mutants > 0 ? this.killed : 1) / ((this.mutants - this.discarded) || 1) * 100).toFixed(2)
      console.log(`Mutant coverage: ${this.coverage}%`)
      setImmediate(resolve)
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
  async timeCleanTests () {
    console.log(`Verifying and timing your test suite`)
    const start = +new Date()
    const child = spawn(this.npmCommand, ['test'], {cwd: path.resolve(`.mutode/mutode-${this.id}-0`)})

    child.stderr.on('data', data => {
      debug(data.toString())
    })

    child.stdout.on('data', data => {
      debug(data.toString())
    })

    return new Promise((resolve, reject) => {
      child.on('exit', code => {
        if (code !== 0) return reject(new Error('Test suite most exit with code 0 with no mutants for Mutode to continue'))
        const diff = +new Date() - start
        const timeout = Math.max(Math.ceil(diff / 1000) * 2500, 5000)
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
  async copyFirst () {
    console.logSame(`Creating a copy of your module... `)
    await copyDir('./', `.mutode/mutode-${this.id}-0`, {dot: true, filter: p => !p.startsWith('.')})
    console.log('Done\n')
  }

  /**
   * Creates <i>this.concurrency<i/> exact copies of the AUT.
   * @private
   * @returns {Promise} - Promise that resolves once the copies are created.
   */
  async copy () {
    if (this.concurrency === 1) return
    console.logSame(`Creating ${this.concurrency - 1} extra copies of your module... `)
    for (let i = 1; i < this.concurrency; i++) {
      console.logSame(`${i}.. `)
      await copyDir('./', `.mutode/mutode-${this.id}-${i}`, {dot: true, filter: p => !p.startsWith('.')})
    }
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
  async delete () {
    const toDelete = await globby(`.mutode/*`, {dot: true, onlyDirectories: true})
    if (toDelete.length === 0) return
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
