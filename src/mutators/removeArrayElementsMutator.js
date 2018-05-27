const walk = require('babylon-walk')
const debug = require('debug')('mutode:removeArrayElementsMutator')

const mutantRunner = require('../mutantRunner')
const lineDiff = require('../util/lineDiff')

/**
 * @description Mutates array by removing single elements.
 * @function removeArrayElementsMutator
 * @memberOf module:Mutators
 */
module.exports = async function removeArrayElementsMutator ({mutodeInstance, filePath, lines, queue, ast}) {
  debug('Running remove array elements mutator on %s', filePath)

  walk.simple(ast, {
    ArrayExpression (arrayNode) {
      for (const node of arrayNode.elements) {
        let contentToWrite = ''
        let log = ''
        if (node.loc.start.line !== node.loc.end.line) {
          const line = node.loc.start.line

          const mutantId = ++mutodeInstance.mutants
          log = `MUTANT ${mutantId}:\tRAEM Lines ${node.loc.start.line}-${node.loc.end.line}: Commented element #${arrayNode.elements.indexOf(node) + 1}`
          debug(log)
          mutodeInstance.mutantLog(log)
          const linesCopy = lines.slice()
          for (let i = line - 1; i < node.loc.end.line; i++) {
            linesCopy[i] = `// ${linesCopy[i]}`
          }
          contentToWrite = linesCopy.join('\n')
        } else {
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
          log = `MUTANT ${mutantId}:\tRAEM Line ${line}:\t${diff}`
          debug(log)
          mutodeInstance.mutantLog(`MUTANT ${mutantId}:\tRAEM ${filePath} Line ${line}:\t\`${lineContent.trim()}\` > \`${mutantLineContent.trim()}'\``)
          const linesCopy = lines.slice()
          linesCopy[line - 1] = mutantLineContent
          contentToWrite = linesCopy.join('\n')
        }
        queue.push(mutantRunner({mutodeInstance, filePath, contentToWrite, log}))
      }
    }
  })
}
