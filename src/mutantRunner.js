const chalk = require('chalk')
const spawn = require('child_process').spawn
const Debug = require('debug')
const fs = require('fs')
const path = require('path')

/**
 * @module MutantRunner
 * @description Runs a given mutant in a free worker, logging one of the possible results (survived, killed or discarded) and the time of execution.
 *
 * Execution is done with the `npm test` command inside the worker's directory
 */
module.exports = function MutantRunner ({mutodeInstance, filePath, contentToWrite, log}) {
  const debug = Debug(`mutants:${filePath}`)
  return async index => {
    await new Promise(resolve => {
      const startTime = process.hrtime()
      fs.writeFileSync(`.mutode/mutode-${mutodeInstance.id}-${index}/${filePath}`, contentToWrite)
      const child = spawn(mutodeInstance.npmCommand, ['test'], {
        cwd: path.resolve(`.mutode/mutode-${mutodeInstance.id}-${index}`),
        detached: true,
        shell: true
      })

      child.stderr.on('data', data => {
        debug(data.toString())
      })

      const timeout = setTimeout(() => {
        child.kill('SIGKILL')
        process.kill(-child.pid)
      }, mutodeInstance.timeout).unref()

      child.on('exit', (code, signal) => {
        const endTime = process.hrtime(startTime)
        const endTimeMS = (endTime[0] * 1e3 + endTime[1] / 1e6).toFixed(0)
        const timeDiff = chalk.gray(`${endTimeMS} ms`)
        clearTimeout(timeout)
        if (code === 0) {
          console.log(`${log}\t${chalk.bgRed('survived')} ${timeDiff}`)
          mutodeInstance.survived++
        } else if (signal) {
          console.log(`${log}\t${chalk.bgBlue('discarded (timeout)')} ${timeDiff}`)
          mutodeInstance.discarded++
        } else {
          console.log(`${log}\t${chalk.bgGreen('killed')} ${timeDiff}`)
          mutodeInstance.killed++
        }
        // console.log('exit', code)
        resolve()
      })
    })
  }
}
