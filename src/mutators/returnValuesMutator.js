const walk = require('babylon-walk')
const debug = require('debug')('mutode:incrementsMutator')

const mutantRunner = require('../mutantRunner')
const lineDiff = require('../util/lineDiff')

/**
 * @description Mutates `-a` to `a`
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
          let newReturnValue = !node.argument.value
          mutantLineContent = lineContent.substr(0, node.argument.loc.start.column) +
            newReturnValue +
            lineContent.substr(node.argument.loc.end.column)
          break
        }
        case 'NumericLiteral': {
          let newReturnValue = node.argument.value === 0 ? 1 : 0
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
