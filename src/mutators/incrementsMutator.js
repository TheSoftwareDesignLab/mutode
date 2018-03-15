const async = require('async')
const walk = require('babylon-walk')
const debug = require('debug')('mutode:incrementsMutator')
const jsDiff = require('diff')
const esprima = require('esprima')
const esquery = require('esquery')
const chalk = require('chalk')

const mutantRunner = require('../mutantRunner')

const operators = [
  ['++', '--'],
  ['--', '++']
]

/**
 * Hola
 * @method
 * @name incrementsMutator
 * @memberOf module:Mutators
 * @param mutodeInstance
 * @param filePath
 * @param lines
 * @param queue
 * @returns {Promise}
 */
module.exports = async function incrementsMutator ({mutodeInstance, filePath, lines, queue, ast}) {
  debug('Running increments mutator on %s', filePath)

  walk.simple(ast, {
    UpdateExpression (node, state) {
      for (const pair of operators) {
        if (node.operator !== pair[0]) {
          continue
        }
        const line = node.loc.start.line
        const lineContent = lines[line - 1]

        const mutantLineContent = lineContent.substr(0, node.loc.start.column) +
          lineContent.substr(node.loc.start.column, node.loc.end.column - node.loc.start.column).replace(pair[0], pair[1]) +
          lineContent.substr(node.loc.end.column)

        const mutantId = ++mutodeInstance.mutants
        const diff = jsDiff.diffChars(lineContent.trim(), mutantLineContent.trim()).map(stringDiff => {
          if (stringDiff.added) return chalk.green(stringDiff.value)
          else if (stringDiff.removed) return chalk.red(stringDiff.value)
          else return chalk.gray(stringDiff.value)
        }).join('')
        const log = `MUTANT ${mutantId}:\tIM Line ${line}: ${diff}...\t`
        debug(log)
        mutodeInstance.mutantLog(`MUTANT ${mutantId}:\tIM ${filePath} Line ${line}: \`${lineContent.trim()}\` > \`${mutantLineContent.trim()}'\`...\t`)
        const linesCopy = lines.slice()
        linesCopy[line - 1] = mutantLineContent
        const contentToWrite = linesCopy.join('\n')
        queue.push(mutantRunner({mutodeInstance, filePath, contentToWrite, log}))
      }
    }
  }, {})
}
