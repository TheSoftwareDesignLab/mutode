const async = require('async')
const debug = require('debug')('mutode:conditionalsBoundaryMutator')
const jsDiff = require('diff')
const escapeReg = require('escape-string-regexp')
const chalk = require('chalk')

const mutantRunner = require('../mutantRunner')

/**
 * Hola
 * @method
 * @name conditionalsBoundaryMutator
 * @memberOf module:Mutators
 * @param mutodeInstance
 * @param filePath
 * @param lines
 * @param queue
 * @returns {Promise}
 */
module.exports = async function conditionalsBoundaryMutator ({mutodeInstance, filePath, lines, queue}) {
  debug('Running conditionals boundary mutator on %s', filePath)
  return new Promise(resolve => {
    async.timesSeries(lines.length, async n => {
      const line = lines[n]
      const operators = [
        [' < ', ' <= '],
        [' <= ', ' < '],
        [' > ', ' >= '],
        [' >= ', ' > ']
      ]
      const mutants = []
      for (const pair of operators) {
        const reg = new RegExp(`${escapeReg(pair[0])}`, 'g')
        let matches = null
        while ((matches = reg.exec(line)) !== null) {
          mutants.push(
            line.substr(0, matches.index + matches[0].indexOf(pair[0])) +
            pair[1] +
            line.substr(matches.index + matches[0].indexOf(pair[0]) + pair[0].length)
          )
        }
      }
      for (const mutant of mutants) {
        const mutantId = ++mutodeInstance.mutants
        const diff = jsDiff.diffChars(line.trim(), mutant.trim()).map(stringDiff => {
          if (stringDiff.added) return chalk.green(stringDiff.value)
          else if (stringDiff.removed) return chalk.red(stringDiff.value)
          else return chalk.gray(stringDiff.value)
        }).join('')
        const log = `MUTANT ${mutantId}:\tCB Line ${n + 1}: ${diff}...\t`
        debug(log)
        mutodeInstance.mutantLog(`MUTANT ${mutantId}:\tCB Line ${n + 1}: \`${line.trim()}\` > \`${mutant.trim()}'\`...\t`)
        const linesCopy = lines.slice()
        linesCopy[n] = mutant
        const contentToWrite = linesCopy.join('\n')
        queue.push(mutantRunner({mutodeInstance, filePath, contentToWrite, log}))
      }
    }, resolve)
  })
}
