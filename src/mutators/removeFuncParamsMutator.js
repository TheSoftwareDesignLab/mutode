const walk = require('babylon-walk')
const debug = require('debug')('mutode:removeFuncDeclarationParamsMutator')

const mutantRunner = require('../mutantRunner')
const lineDiff = require('../util/lineDiff')

/**
 * @description Mutates function declarations removing parameters
 * @function removeFuncDeclarationParamsMutator
 * @memberOf module:Mutators
 */
module.exports = async function removeFuncDeclarationParamsMutator ({mutodeInstance, filePath, lines, queue, ast}) {
  debug('Running remove function declaration parameters mutator on %s', filePath)

  walk.simple(ast, {
    FunctionDeclaration (functionNode) {
      for (const node of functionNode.params) {
        const line = node.loc.start.line
        const lineContent = lines[line - 1]

        let trimmed = false
        let start = lineContent.substr(0, node.loc.start.column)
        if (start.trim().endsWith(',')) {
          start = start.substr(0, start.lastIndexOf(','))
          trimmed = true
        }
        let end = lineContent.substr(node.loc.end.column)
        if (!trimmed && end.startsWith(',')) end = end.substr(1).trim()
        const mutantLineContent = start + end

        const mutantId = ++mutodeInstance.mutants
        const diff = lineDiff(lineContent, mutantLineContent)
        const log = `MUTANT ${mutantId}:\tRFDPM Line ${line}:\t${diff}`
        debug(log)
        mutodeInstance.mutantLog(`MUTANT ${mutantId}:\tRFDPM ${filePath} Line ${line}:\t\`${lineContent.trim()}\` > \`${mutantLineContent.trim()}'\``)
        const linesCopy = lines.slice()
        linesCopy[line - 1] = mutantLineContent
        const contentToWrite = linesCopy.join('\n')
        queue.push(mutantRunner({mutodeInstance, filePath, contentToWrite, log}))
      }
    }
  })
}
