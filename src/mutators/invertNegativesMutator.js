const walk = require('babylon-walk')
const debug = require('debug')('mutode:invertNegativesMutator')

const mutantRunner = require('../mutantRunner')
const lineDiff = require('../util/lineDiff')

/**
 * @description Mutates `-a` to `a`.
 * @function invertNegativesMutator
 * @memberOf module:Mutators
 */
module.exports = async function invertNegativesMutator ({ mutodeInstance, filePath, lines, queue, ast }) {
  debug('Running invert negatives mutator on %s', filePath)

  walk.simple(ast, {
    UnaryExpression (node) {
      if (node.operator !== '-') {
        return
      }
      const line = node.loc.start.line
      const lineContent = lines[line - 1]

      const mutantLineContent = lineContent.substr(0, node.loc.start.column) +
        lineContent.substr(node.loc.start.column + 1)

      const mutantId = ++mutodeInstance.mutants
      const diff = lineDiff(lineContent, mutantLineContent)
      const log = `MUTANT ${mutantId}:\tINM Line ${line}:\t${diff}...`
      debug(log)
      mutodeInstance.mutantLog(`MUTANT ${mutantId}:\tINM ${filePath} Line ${line}:\t\`${lineContent.trim()}\` > \`${mutantLineContent.trim()}'\``)
      const linesCopy = lines.slice()
      linesCopy[line - 1] = mutantLineContent
      const contentToWrite = linesCopy.join('\n')
      queue.push(mutantRunner({ mutodeInstance, filePath, contentToWrite, log }))
    }
  })
}
