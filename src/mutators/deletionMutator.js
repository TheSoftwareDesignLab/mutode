const async = require('async')
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
module.exports = async function deletionMutator ({mutodeInstance, filePath, lines, queue}) {
  debug('Running deletion mutator on %s', filePath)
  return new Promise(resolve => {
    async.timesSeries(lines.length, async n => {
      debug('Analyzing line %d', n)
      const line = lines[n]
      if (line.length === 0 || /^\s*$/.test(line)) {
        debug('Empty line, continuing')
        return
      }
      if (line.trim().endsWith('{') || line.trim().startsWith('}')) {
        debug('Code block line, continuing')
        return
      }
      if (line.includes('console.') || line.includes('debug(')) {
        debug('Logging line, continuing')
        return
      }
      if (line.includes('module.exports') || line.startsWith('exports = ')) {
        debug('Module line, continuing')
        return
      }
      const mutantId = ++mutodeInstance.mutants
      const log = `MUTANT ${mutantId}:\tDM Deleted line ${n + 1}: \`${lines[n].trim()}\`...\t`
      debug(log)
      mutodeInstance.mutantLog(log)
      const contentToWrite = lines.slice(0, n).concat(lines.slice(n + 1, lines.length)).join('\n')
      queue.push(mutantRunner({mutodeInstance, filePath, contentToWrite, log}))
    }, resolve)
  })
}
