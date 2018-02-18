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

class Mutode {
  constructor (paths = ['src/*']) {
    Mutode.mkdir()
    this.filePaths = globby.sync(paths)
    if (this.filePaths.length === 0) {
      throw new Error('No files found in the specified paths')
    }
    debug('File paths %o', this.filePaths)

    this.tmpPath = path.resolve('../mutode-0')
    this.mutants = 0
    this.killed = 0
    this.survivors = 0
    this.discarded = 0
    this.coverage = 0
    this.mutators = []
    this.concurrency = 2 // os.cpus().length

    this.loadMutants()

    const mutantsLogFile = fs.createWriteStream(path.resolve('./.mutode/mutants.log'), { flags: 'w' })
    this.mutantLog = string => mutantsLogFile.write(string + '\n')
    const logFile = fs.createWriteStream(path.resolve('./.mutode/mutode.log'), { flags: 'w' })
    const stream = stripAnsiStream()

    stream.pipe(logFile)

    process.stdout.write = (function (write) {
      return function (string, encoding, fd) {
        write.apply(process.stdout, arguments)
        stream.write(string)
      }
    })(process.stdout.write)
  }

  async run () {
    try {
      await this.delete()
      await this.copy()
      await this.runCleanTests()
      await new Promise((resolve, reject) => {
        async.eachSeries(this.filePaths, async (filePath, ind) => {
          debug('Creating mutants for %s', filePath)
          const queues = []
          for (let i = 0; i < this.concurrency; i++) {
            queues[i] = async.queue(async task => {
              console.log('Running in', i)
              await task(i)
              console.log('freed ', i)
            }, 1)
          }
          const queue = (task) => {
            let bestQueue = 0
            let bestQueueLength = queues[0].length()
            for (let i = 0; i < this.concurrency; i++) {
              if (queues[i].length() < bestQueueLength) {
                bestQueue = i
                bestQueueLength = queues[i].length()
              }
            }
            console.log('pushed to ', bestQueue)
            queues[bestQueue].push(task)
          }
          const fileContent = (await readFile(filePath)).toString()
          const lines = fileContent.split('\n')
          // console.log(`There are ${lines.length} lines`)
          for (const mutator of this.mutators) {
            await mutator({mutodeInstance: this, filePath, lines, queue})
          }
          await new Promise(resolve => {
            const doneCB = () => {
              console.log(`Finished %s`, filePath)
              for (let i = 0; i < this.concurrency; i++) {
                fs.writeFileSync(`../mutode-${i}/${filePath}`, fileContent) // Reset file to original content
              }
              console.log('')
              resolve()
            }

            let done = 0
            for (let i = 0; i < this.concurrency; i++) {
              queues[i].drain = () => {
                done++
                if (done === this.concurrency) {
                  doneCB()
                }
              }
            }
          })
        }, async err => {
          if (err) {
            console.error(err)
            reject(err)
          }
          console.log(`Out of ${this.mutants} mutants, ${this.killed} were killed, ${this.survivors} survived and ${this.discarded} were discarded`)
          this.coverage = +(this.killed / this.mutants * 100).toFixed(2)
          console.log(`Mutant coverage: ${this.coverage}%`)
          // process.exit()
          resolve()
        })
      })
    } catch (e) {
      console.error(e.message)
    } finally {
      await this.delete()
    }
  }

  async runCleanTests () {
    console.log(`Verifying and timing your test suite`)
    const start = +new Date()
    const child = spawn('npm', ['test'], {cwd: this.tmpPath})

    setTimeout(() => {
      child.connected && child.disconnect()
    }, 60000).unref()

    await new Promise((resolve, reject) => {
      child.on('exit', code => {
        if (code !== 0) reject(new Error('Test suite most exit with code 0 with no mutants for Mutode to continue'))
        const diff = +new Date() - start
        this.expectedTime = diff
        this.timeout = Math.max(diff * 2, 2)
        console.log(`Took ${(diff / 1000).toFixed(2)} seconds to run full test suite\n`)
        resolve()
      })
    })
  }

  loadMutants () {
    console.logSame('Loading mutants... ')
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

  async copy () {
    console.logSame(`Creating ${this.concurrency} ${this.concurrency > 1 ? 'copies' : 'copy'} of your module... `)
    for (let i = 0; i < this.concurrency; i++) {
      console.logSame(`${i + 1}.. `)
      await copyDir('./', `../mutode-${i}`)
    }
    console.log('Done\n')
  }

  static mkdir () {
    mkdirp.sync(path.resolve('./.mutode'))
  }

  async delete () {
    const toDelete = await globby('../mutode-*')
    if (!toDelete) return
    console.logSame('Deleting copies... ')
    for (const path of toDelete) {
      await del(path, {force: true})
    }
    console.log('Done\n')
  }
}

module.exports = Mutode
