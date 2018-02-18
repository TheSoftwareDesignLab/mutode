const async = require('async')

const genericMutator = require('../mutantRunner')

module.exports = async function ({mutodeInstance, filePath, lines, queue}) {
  console.log('Running Deletion Mutator')
  await new Promise((resolve, reject) => {
    async.timesSeries(lines.length, async n => {
      const line = lines[n]
      if (line.length === 0 || /^\s*$/.test(line)) {
        // console.log('Empty line, continuing')
        return
      }
      if (line.includes('{') || line.includes('}')) {
        // console.log('Structure line, continuing')
        return
      }
      mutodeInstance.mutants++
      const log = `MUTANT ${mutodeInstance.mutants}:\tDeleted line ${n + 1}...\t`
      mutodeInstance.mutantLog(log)
      const contentToWrite = lines.slice(0, n).concat(lines.slice(n + 1, lines.length)).join('\n')
      queue(genericMutator({mutodeInstance, filePath, contentToWrite, log}))
    }, resolve)
  })
}
