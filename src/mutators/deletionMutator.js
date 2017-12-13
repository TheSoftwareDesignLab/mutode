const async = require('async')

const genericMutator = require('../mutantRunner')

module.exports = async function ({cancerInstance, filePath, lines}) {
  console.log('Running Deletion Mutator')
  return new Promise((resolve, reject) => {
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
      cancerInstance.mutants++
      const logString = `MUTANT ${cancerInstance.mutants}:\tDeleted line ${n + 1}...\t`
      console.logSame(logString)
      cancerInstance.mutantLog(logString)
      const contentToWrite = lines.slice(0, n).concat(lines.slice(n + 1, lines.length)).join('\n')
      await genericMutator({cancerInstance, filePath, contentToWrite})
    }, resolve)
  })
}
