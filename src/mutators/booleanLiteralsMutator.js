const walk = require('babylon-walk')
const debug = require('debug')('mutode:booleanLiteralsMutator')

const mutantRunner = require('../mutantRunner')
const lineDiff = require('../util/lineDiff')

/**
 * @description Mutates boolean literals values.
 * Boolean literals are mutated to their negative.
 * @function booleanLiteralsMutator
 * @memberOf module:Mutators
 */
module.exports = async function booleanLiteralsMutator ({ mutodeInstance, filePath, lines, queue, ast }) {
  debug('Running boolean literals mutator on %s', filePath)

  walk.simple(ast, {
    BooleanLiteral (node) {
      const line = node.loc.start.line
      const lineContent = lines[line - 1]

      const mutantLineContent = lineContent.substr(0, node.loc.start.column) +
        !node.value +
        lineContent.substr(node.loc.end.column)

      const mutantId = ++mutodeInstance.mutants
      const diff = lineDiff(lineContent, mutantLineContent)
      const log = `MUTANT ${mutantId}:\tBLM Line ${line}:\t${diff}...`
      debug(log)
      mutodeInstance.mutantLog(`MUTANT ${mutantId}:\tBLM ${filePath} Line ${line}:\t\`${lineContent.trim()}\` > \`${mutantLineContent.trim()}'\``)
      const linesCopy = lines.slice()
      linesCopy[line - 1] = mutantLineContent
      const contentToWrite = linesCopy.join('\n')
      queue.push(mutantRunner({ mutodeInstance, filePath, contentToWrite, log }))
    }
  })
}
