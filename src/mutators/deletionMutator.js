const walk = require('babylon-walk')
const chalk = require('chalk')
const debug = require('debug')('mutode:deletionMutator')

const mutantRunner = require('../mutantRunner')

/**
 * @description Mutator that traverses files and deletes single lines.
 * @function deletionMutator
 * @memberOf module:Mutators
 */
module.exports = async function deletionMutator ({mutodeInstance, filePath, lines, queue, ast}) {
  debug('Running deletion mutator on %s', filePath)

  const linesCheck = {}

  walk.simple(ast, {
    Statement (node) {
      if (linesCheck[node.loc.start.line] || node.type === 'BlockStatement' || (node.consequent && node.consequent.type === 'BlockStatement')) {
        debug('Skipped line', node.loc.start.line)
        return
      }
      const line = node.loc.start.line
      const lineContent = lines[line - 1]

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
      const log = `MUTANT ${mutantId}:\tDM Deleted line ${line}:\t${chalk.inverse(lineContent.trim())}`
      debug(log)
      mutodeInstance.mutantLog(log)
      const contentToWrite = lines.slice(0, line - 1).concat(lines.slice(line, lines.length)).join('\n')
      queue.push(mutantRunner({mutodeInstance, filePath, contentToWrite, log}))
    }
  })
}
