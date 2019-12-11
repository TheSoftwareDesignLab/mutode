const walk = require('babylon-walk')
const debug = require('debug')('mutode:removeFunctionsMutator')

const mutantRunner = require('../mutantRunner')

/**
 * @description Mutates functions by commenting them
 * @function removeFunctionsMutator
 * @memberOf module:Mutators
 */
module.exports = async function removeFunctionsMutator ({ mutodeInstance, filePath, lines, queue, ast }) {
  debug('Running remove functions mutator on %s', filePath)

  walk.simple(ast, {
    Function (node) {
      const line = node.loc.start.line
      const functionName = node.id ? node.id.name : node.key ? node.key.name : '(anonymous / assigned)'

      const mutantId = ++mutodeInstance.mutants
      const log = `MUTANT ${mutantId}:\tRFM Lines ${node.loc.start.line}-${node.loc.end.line}: Commented function ${functionName}`
      debug(log)
      mutodeInstance.mutantLog(log)
      const linesCopy = lines.slice()
      for (let i = line - 1; i < node.loc.end.line; i++) {
        linesCopy[i] = `// ${linesCopy[i]}`
      }
      const contentToWrite = linesCopy.join('\n')
      queue.push(mutantRunner({ mutodeInstance, filePath, contentToWrite, log }))
    }
  })
}
