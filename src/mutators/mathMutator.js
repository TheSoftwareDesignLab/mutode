const async = require('async')
const debug = require('debug')('mutode:mathMutator')
const jsDiff = require('diff')
const esprima = require('esprima')
const esquery = require('esquery')
const chalk = require('chalk')

const mutantRunner = require('../mutantRunner')

/**
 * Hola
 * @method
 * @name mathMutator
 * @memberOf module:Mutators
 * @param mutodeInstance
 * @param filePath
 * @param lines
 * @param queue
 * @returns {Promise}
 */
module.exports = async function mathMutator ({mutodeInstance, filePath, lines, queue}) {
  debug('Running math mutator on %s', filePath)
  await new Promise((resolve, reject) => {
    async.timesSeries(lines.length, async n => {
      const line = lines[n]
      try {
        const ast = esprima.parse(line)
        let result = esquery(ast, '[type="BinaryExpression"]')
        if (result.length < 1) result = esquery(ast, '[type="UpdateExpression"]')
        if (result.length < 1) return
      } catch (e) {
        // console.error(e)
      }
      const operators = [
        ['+', '-'],
        ['-', '+'],
        ['*', '/'],
        ['/', '*'],
        ['%', '*'],
        ['&', '|'],
        ['|', '&'],
        ['^', '|'],
        ['<<', '>>'],
        ['>>', '<<'],
        ['++', '--'],
        ['--', '++'],
        ['**', '*']
      ]
      const mutants = []
      for (const pair of operators) {
        const regex = pair[0].length === 1 ? `[^\\${pair[0]}]\\${pair[0]}[^\\${pair[0]}]` : `\\${pair[0].charAt(0)}{${pair[0].length}}`
        const reg = new RegExp(regex, 'g')
        let matches = null
        while ((matches = reg.exec(line)) !== null) {
          mutants.push(line.substr(0, matches.index + matches[0].indexOf(pair[0])) + pair[1] + line.substr(matches.index + matches[0].indexOf(pair[0]) + pair[0].length))
        }
      }
      for (const mutant of mutants) {
        mutodeInstance.mutants++
        const diff = jsDiff.diffChars(line.trim(), mutant.trim()).map(stringDiff => {
          if (stringDiff.added) return chalk.green(stringDiff.value)
          else if (stringDiff.removed) return chalk.red(stringDiff.value)
          else return chalk.gray(stringDiff.value)
        }).join('')
        const log = `MUTANT ${mutodeInstance.mutants}:\tLine ${n}: ${diff}...\t`
        mutodeInstance.mutantLog(`MUTANT ${mutodeInstance.mutants}:\tLine ${n}: \`${line.trim()}\` > \${mutant.trim()}'\`...\t`)
        const linesCopy = lines.slice()
        linesCopy[n] = mutant
        const contentToWrite = linesCopy.join('\n')
        queue.push(mutantRunner({mutodeInstance, filePath, contentToWrite, log}))
      }
    }, err => {
      if (err) return reject(err)
      resolve()
    })
  })
}
