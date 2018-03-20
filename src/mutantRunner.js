const chalk = require('chalk')
const spawn = require('child_process').spawn
const Debug = require('debug')
const fs = require('fs')
const path = require('path')

/**
 * @module MutantRunner
 */

/**
 * Mutant runner
 * @param mutodeInstance {Mutode} - Mutode's instance
 * @param filePath {string} - File path where the mutant is being inserted
 * @param contentToWrite {string} - File's content with the mutant
 * @param log {string} - Mutant's description
 * @returns {function} - Function that runs the mutant in the worker passed by index
 */
module.exports = function MutantRunner ({mutodeInstance, filePath, contentToWrite, log}) {
  const debug = Debug(`mutants:${filePath}`)
  return async index => {
    await new Promise(resolve => {
      const startTime = process.hrtime()
      fs.writeFileSync(`.mutode/mutode-${mutodeInstance.id}-${index}/${filePath}`, contentToWrite)
      const child = spawn('npm', ['test'], {cwd: path.resolve(`.mutode/mutode-${mutodeInstance.id}-${index}`)})

      child.stderr.on('data', data => {
        debug(data.toString())
      })

      const timeout = setTimeout(() => {
        child.kill('SIGKILL')
      }, mutodeInstance.timeout).unref()

      child.on('exit', (code, signal) => {
        const endTime = process.hrtime(startTime)
        const endTimeMS = (endTime[0] * 1e3 + endTime[1] / 1e6).toFixed(0)
        const timeDiff = chalk.gray(`${endTimeMS} ms`)
        clearTimeout(timeout)
        if (code === 0) {
          console.log(`${log} ${chalk.bgRed('survived')} ${timeDiff}`)
          mutodeInstance.survived++
        } else if (signal) {
          console.log(`${log} ${chalk.bgBlue('discarded (timeout)')} ${timeDiff}`)
          mutodeInstance.discarded++
        } else {
          console.log(`${log} ${chalk.bgGreen('killed')} ${timeDiff}`)
          mutodeInstance.killed++
        }
        // console.log('exit', code)
        resolve()
      })
    })
  }
}
