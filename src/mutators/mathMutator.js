const walk = require('babylon-walk')
const debug = require('debug')('mutode:mathMutator')
const jsDiff = require('diff')
const chalk = require('chalk')

const mutantRunner = require('../mutantRunner')

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
  ['**', '*']
]

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
module.exports = async function mathMutator ({mutodeInstance, filePath, lines, queue, ast}) {
  debug('Running math mutator on %s', filePath)
  walk.simple(ast, {
    BinaryExpression (node, state) {
      for (const pair of operators) {
        if (node.operator !== pair[0] || node.left.loc.end - node.right.loc.start > 5) {
          continue
        }
        const line = node.loc.start.line
        const lineContent = lines[line - 1]

        const mutantLineContent = lineContent.substr(0, node.left.loc.end.column) +
          lineContent.substr(node.left.loc.end.column, node.right.loc.start.column - node.left.loc.end.column).replace(pair[0], pair[1]) +
          lineContent.substr(node.right.loc.start.column)

        const mutantId = ++mutodeInstance.mutants
        const diff = jsDiff.diffChars(lineContent.trim(), mutantLineContent.trim()).map(stringDiff => {
          if (stringDiff.added) return chalk.green(stringDiff.value)
          else if (stringDiff.removed) return chalk.red(stringDiff.value)
          else return chalk.gray(stringDiff.value)
        }).join('')
        const log = `MUTANT ${mutantId}:\tMM Line ${line}: ${diff}...\t`
        debug(log)
        mutodeInstance.mutantLog(`MUTANT ${mutantId}:\tMM ${filePath} Line ${line}: \`${lineContent.trim()}\` > \`${mutantLineContent.trim()}'\`...\t`)
        const linesCopy = lines.slice()
        linesCopy[line - 1] = mutantLineContent
        const contentToWrite = linesCopy.join('\n')
        queue.push(mutantRunner({mutodeInstance, filePath, contentToWrite, log}))
      }
    }
  }, {})
}
