const Debug = require('debug')
const spawn = require('child_process').spawn
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
    await new Promise((resolve, reject) => {
      fs.writeFileSync(`.mutode/mutode-${index}/${filePath}`, contentToWrite)
      const child = spawn('npm', ['test'], {cwd: path.resolve(`.mutode/mutode-${index}`)})

      child.stderr.on('data', data => {
        debug(data.toString())
      })

      const timeout = setTimeout(() => {
        console.log(`${log} discarded (timeout)`)
        child.kill('SIGKILL')
      }, mutodeInstance.timeout).unref()

      child.on('exit', (code, signal) => {
        clearTimeout(timeout)
        if (code === 0) {
          console.log(`${log} survived`)
          mutodeInstance.survived++
        } else if (signal) {
          mutodeInstance.discarded++
        } else {
          console.log(`${log} killed`)
          mutodeInstance.killed++
        }
        // console.log('exit', code)
        resolve()
      })
    })
  }
}
