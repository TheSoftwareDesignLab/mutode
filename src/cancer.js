const async = require('async')
const spawn = require('child_process').spawn
const debug = require('debug')('cancer')
const mkdirp = require('mkdirp')
const del = require('del')
const stripAnsiStream = require('strip-ansi-stream')
const fs = require('fs')
const globby = require('globby')
const path = require('path')
const copyDir = require('recursive-copy')
const {promisify} = require('util')

const readFile = promisify(fs.readFile)
console.logSame = (t) => process.stdout.write(t)

class Cancer {
  constructor (paths = ['src/*']) {
    Cancer.mkdir()
    this.paths = paths
    this.tmpPath = path.resolve('../cancer-tmp')
    this.mutants = 0
    this.killed = 0
    this.survivors = 0
    this.discarded = 0
    this.coverage = 0
    this.mutators = []

    this.loadMutants()

    const mutantsLogFile = fs.createWriteStream(path.resolve('./.cancer/mutants.log'), { flags: 'w' })
    this.mutantLog = string => mutantsLogFile.write(string + '\n')
    const logFile = fs.createWriteStream(path.resolve('./.cancer/cancer.log'), { flags: 'w' })
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
    await Cancer.delete()
    await Cancer.copy()
    await this.runCleanTests()
    const filePaths = await globby(this.paths)
    return new Promise((resolve, reject) => {
      async.eachSeries(filePaths, async filePath => {
        console.log(filePath)
        const fileContent = (await readFile(filePath)).toString()
        const lines = fileContent.split('\n')
        // console.log(`There are ${lines.length} lines`)
        for (const mutator of this.mutators) {
          await mutator({cancerInstance: this, filePath, lines})
        }
        console.log('')
      }, async (err) => {
        if (err) {
          console.error(err)
          reject(err)
        }
        await Cancer.delete()
        console.log(`Out of ${this.mutants} mutants, ${this.killed} were killed, ${this.survivors} survived and ${this.discarded} were discarded`)
        this.coverage = +(this.killed / this.mutants * 100).toFixed(2)
        console.log(`Mutant coverage: ${this.coverage}%`)
        // process.exit()
        resolve()
      })
    })
  }

  async runCleanTests () {
    console.log(`Verifying and timing your test suite`)
    const start = +new Date()
    const child = spawn('npm', ['test'], {cwd: this.tmpPath})

    setTimeout(() => {
      child.connected && child.disconnect()
    }, 60000).unref()

    return new Promise((resolve, reject) => {
      child.on('exit', code => {
        if (code !== 0) reject(new Error('Test suite most exit with code 0 with no mutants for Cancer to run'))
        const diff = +new Date() - start
        this.expectedTime = diff
        this.timeout = Math.max(diff * 2, 2)
        console.log(`Took ${(diff / 1000).toFixed(2)} seconds to run full test suite\n`)
        resolve()
      })
    })
  }

  loadMutants () {
    console.logSame('Loading mutants...')
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

  static mkdir () {
    mkdirp.sync(path.resolve('./.cancer'))
  }

  static async copy () {
    console.logSame('Creating a copy of your module... ')
    await copyDir('./', '../cancer-tmp')
    console.log('Done\n')
  }

  static async delete () {
    if (!fs.existsSync('../cancer-tmp')) return
    console.logSame('Deleting folder... ')
    await del('../cancer-tmp', {force: true})
    console.log('Done\n')
  }
}

module.exports = Cancer
