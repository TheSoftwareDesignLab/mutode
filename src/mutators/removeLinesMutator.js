const walk = require('babylon-walk')
const chalk = require('chalk')
const debug = require('debug')('mutode:deletionMutator')

const mutantRunner = require('../mutantRunner')

/**
 * @description Mutator that traverses files and comments single line statements.
 * @function commentLinesMutator
 * @memberOf module:Mutators
 */
module.exports = async function commentLinesMutator ({mutodeInstance, filePath, lines, queue, ast}) {
  debug('Running line commenter mutator on %s', filePath)

  const linesCheck = {}

  walk.simple(ast, {
    Statement (node) {
      debug(node)
      if (node.loc.start.line !== node.loc.end.line) {
        debug('Multi line statement, continuing')
        return
      }
      if (linesCheck[node.loc.start.line]) {
        debug('Already checked line, continuing')
        return
      }
      const line = node.loc.start.line
      const lineContent = lines[line - 1]

      linesCheck[line] = true

      if (lineContent.trim().startsWith('console.') || lineContent.trim().startsWith('debug(')) {
        debug('Logging line, continuing')
        return
      }
      if (lineContent.trim().endsWith('{')) {
        debug('Code block line, continuing')
        return
      }

      const mutantId = ++mutodeInstance.mutants
      const log = `MUTANT ${mutantId}:\tCLM Commented line ${line}:\t${chalk.inverse(lineContent.trim())}`
      debug(log)
      mutodeInstance.mutantLog(log)
      const linesCopy = lines.slice()
      linesCopy[line - 1] = `// ${lineContent}`
      const contentToWrite = linesCopy.join('\n')
      queue.push(mutantRunner({mutodeInstance, filePath, contentToWrite, log}))
    }
  })
}
