const walk = require('babylon-walk')
const debug = require('debug')('mutode:deletionMutator')

const mutantRunner = require('../mutantRunner')

/**
 * Mutator that traverses files and deletes single lines.
 * @method
 * @name deletionMutator
 * @memberOf module:Mutators
 * @param mutodeInstance
 * @param filePath
 * @param lines
 * @param queue
 * @returns {Promise}
 */
module.exports = async function deletionMutator ({mutodeInstance, filePath, lines, queue, ast}) {
  debug('Running deletion mutator on %s', filePath)

  const linesCheck = {}

  walk.simple(ast, {
    Statement (node) {
      debug(node)
      if (linesCheck[node.loc.start.line] || node.type === 'BlockStatement' || (node.consequent && node.consequent.type === 'BlockStatement')) {
        debug('Skipped line', node.loc.start.line)
        return
      }
      debug('a')
      const line = node.loc.start.line
      const lineContent = lines[line - 1]

      debug('b')
      linesCheck[line] = true

      if (lineContent.trim().startsWith('console.') || lineContent.trim().startsWith('debug(')) {
        debug('Logging line, continuing')
        return
      }
      if (lineContent.trim().endsWith('{') || lineContent.trim().startsWith('}')) {
        debug('Code block line, continuing')
        return
      }

      const mutantId = ++mutodeInstance.mutants
      const log = `MUTANT ${mutantId}:\tDM Deleted line ${line}: \`${lineContent.trim()}\`...\t`
      debug(log)
      mutodeInstance.mutantLog(log)
      const contentToWrite = lines.slice(0, line - 1).concat(lines.slice(line, lines.length)).join('\n')
      queue.push(mutantRunner({mutodeInstance, filePath, contentToWrite, log}))
    }
  })
}
