const walk = require('babylon-walk')
const debug = require('debug')('mutode:negateConditionalsMutator')

const mutantRunner = require('../mutantRunner')
const lineDiff = require('../util/lineDiff')

const operators = [
  ['==', '!='],
  ['!=', '=='],
  ['===', '!=='],
  ['!==', '==='],
  ['<=', '>'],
  ['>', '<='],
  ['>=', '<'],
  ['<', '>=']
]

/**
 * @description Hola
 * @function negateConditionalsMutator
 * @memberOf module:Mutators
 */
module.exports = async function negateConditionalsMutator ({mutodeInstance, filePath, lines, queue, ast}) {
  debug('Running conditionals boundary mutator on %s', filePath)

  walk.simple(ast, {
    BinaryExpression (node) {
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
        const diff = lineDiff(lineContent, mutantLineContent)
        const log = `MUTANT ${mutantId}:\tNCM Line ${line}:\t${diff}`
        debug(log)
        mutodeInstance.mutantLog(`MUTANT ${mutantId}:\tNCM ${filePath} Line ${line}:\t\`${lineContent.trim()}\` > \`${mutantLineContent.trim()}'\``)
        const linesCopy = lines.slice()
        linesCopy[line - 1] = mutantLineContent
        const contentToWrite = linesCopy.join('\n')
        queue.push(mutantRunner({mutodeInstance, filePath, contentToWrite, log}))
      }
    }
  })
}
