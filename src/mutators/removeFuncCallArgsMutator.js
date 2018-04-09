const walk = require('babylon-walk')
const debug = require('debug')('mutode:removeFunctionParametersMutator')

const mutantRunner = require('../mutantRunner')
const lineDiff = require('../util/lineDiff')

/**
 * @description Mutates function calls removing arguments
 * @function removeFuncCallArgsMutator
 * @memberOf module:Mutators
 */
module.exports = async function removeFuncCallArgsMutator ({mutodeInstance, filePath, lines, queue, ast}) {
  debug('Running remove function call arguments mutator on %s', filePath)

  walk.simple(ast, {
    CallExpression (functionNode) {
      for (const node of functionNode.arguments) {
        const line = node.loc.start.line
        const lineContent = lines[line - 1]

        let start = lineContent.substr(0, node.loc.start.column)
        if (start.trim().endsWith(',')) start = start.substr(0, start.lastIndexOf(','))
        let end = lineContent.substr(node.loc.end.column)
        if (end.startsWith(',')) end = end.substr(1).trim()
        const mutantLineContent = start + end

        const mutantId = ++mutodeInstance.mutants
        const diff = lineDiff(lineContent, mutantLineContent)
        const log = `MUTANT ${mutantId}:\tRFCAM Line ${line}:\t${diff}`
        debug(log)
        mutodeInstance.mutantLog(`MUTANT ${mutantId}:\tRFCAM ${filePath} Line ${line}:\t\`${lineContent.trim()}\` > \`${mutantLineContent.trim()}'\``)
        const linesCopy = lines.slice()
        linesCopy[line - 1] = mutantLineContent
        const contentToWrite = linesCopy.join('\n')
        queue.push(mutantRunner({mutodeInstance, filePath, contentToWrite, log}))
      }
    }
  })
}
