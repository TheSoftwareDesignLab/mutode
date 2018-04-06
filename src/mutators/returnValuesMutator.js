const walk = require('babylon-walk')
const debug = require('debug')('mutode:incrementsMutator')

const mutantRunner = require('../mutantRunner')
const lineDiff = require('../util/lineDiff')

/**
 * @description Mutates return values.
 * Negates booleans.
 * Numbers > 0 are mutated to 0, 0 is mutated to 1.
 * String are mutated to an empty string. Empty string are mutated to a random string.
 * @function returnValuesMutator
 * @memberOf module:Mutators
 */
module.exports = async function returnValuesMutator ({mutodeInstance, filePath, lines, queue, ast}) {
  debug('Running return values mutator on %s', filePath)

  walk.simple(ast, {
    ReturnStatement (node) {
      const line = node.loc.start.line
      const lineContent = lines[line - 1]
      let mutantLineContent = lineContent
      switch (node.argument.type) {
        case 'BooleanLiteral': {
          const newReturnValue = !node.argument.value
          mutantLineContent = lineContent.substr(0, node.argument.loc.start.column) +
            newReturnValue +
            lineContent.substr(node.argument.loc.end.column)
          break
        }
        case 'NumericLiteral': {
          const newReturnValue = node.argument.value === 0 ? 1 : 0
          mutantLineContent = lineContent.substr(0, node.argument.loc.start.column) +
            newReturnValue +
            lineContent.substr(node.argument.loc.end.column)
          break
        }
        case 'StringLiteral': {
          const newReturnValue = node.argument.value.length === 0 ? `'${Math.random().toString(36).replace(/[^a-z]+/g, '')}'` : node.argument.extra.raw.replace(node.argument.value, '')
          mutantLineContent = lineContent.substr(0, node.argument.loc.start.column) +
            newReturnValue +
            lineContent.substr(node.argument.loc.end.column)
          break
        }
        default:
          return
      }

      const mutantId = ++mutodeInstance.mutants
      const diff = lineDiff(lineContent, mutantLineContent)
      const log = `MUTANT ${mutantId}:\tRVM Line ${line}:\t${diff}...`
      debug(log)
      mutodeInstance.mutantLog(`MUTANT ${mutantId}:\tRVM ${filePath} Line ${line}:\t\`${lineContent.trim()}\` > \`${mutantLineContent.trim()}'\``)
      const linesCopy = lines.slice()
      linesCopy[line - 1] = mutantLineContent
      const contentToWrite = linesCopy.join('\n')
      queue.push(mutantRunner({mutodeInstance, filePath, contentToWrite, log}))
    }
  })
}
