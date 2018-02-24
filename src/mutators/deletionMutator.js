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
  await new Promise((resolve, reject) => {
    async.timesSeries(lines.length, async n => {
      debug('Analyzing line %d', n)
      const line = lines[n]
      if (line.length === 0 || /^\s*$/.test(line)) {
        debug('Empty line, continuing')
        return
      }
      if (line.includes('{') || line.includes('}')) {
        debug('Structure line, continuing')
        return
      }
      mutodeInstance.mutants++
      const log = `MUTANT ${mutodeInstance.mutants}:\tDeleted line ${n + 1}: \`${lines[n].trim()}\`...\t`
      debug(log)
      mutodeInstance.mutantLog(log)
      const contentToWrite = lines.slice(0, n).concat(lines.slice(n + 1, lines.length)).join('\n')
      queue.push(mutantRunner({mutodeInstance, filePath, contentToWrite, log}))
    }, resolve)
  })
}
