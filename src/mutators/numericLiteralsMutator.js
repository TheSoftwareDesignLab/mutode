const walk = require('babylon-walk')
const debug = require('debug')('mutode:numericLiteralsMutator')

const mutantRunner = require('../mutantRunner')
const lineDiff = require('../util/lineDiff')

/**
 * @description Mutates numeric literals values.
 * Numeric literals are mutated to *value + 1*, *value - 1*, *random value*, and 0 if not previously 0.
 * @function numericLiteralsMutator
 * @memberOf module:Mutators
 */
module.exports = async function numericLiteralsMutator ({ mutodeInstance, filePath, lines, queue, ast }) {
  debug('Running numeric literals mutator on %s', filePath)

  walk.simple(ast, {
    NumericLiteral (node) {
      const line = node.loc.start.line
      const lineContent = lines[line - 1]

      const newValues = []

      if (node.value !== 0) newValues.push(0)
      if (node.value !== 1) newValues.push(node.value - 1)
      newValues.push(node.value + 1)
      newValues.push(Math.floor(Math.random() * 1000000))

      for (const newValue of newValues) {
        const mutantLineContent = lineContent.substr(0, node.loc.start.column) +
          newValue +
          lineContent.substr(node.loc.end.column)

        const mutantId = ++mutodeInstance.mutants
        const diff = lineDiff(lineContent, mutantLineContent)
        const log = `MUTANT ${mutantId}:\tNLM Line ${line}:\t${diff}...`
        debug(log)
        mutodeInstance.mutantLog(`MUTANT ${mutantId}:\tNLM ${filePath} Line ${line}:\t\`${lineContent.trim()}\` > \`${mutantLineContent.trim()}'\``)
        const linesCopy = lines.slice()
        linesCopy[line - 1] = mutantLineContent
        const contentToWrite = linesCopy.join('\n')
        queue.push(mutantRunner({ mutodeInstance, filePath, contentToWrite, log }))
      }
    }
  })
}
