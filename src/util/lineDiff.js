const jsDiff = require('diff')
const chalk = require('chalk')

module.exports = (lineContent, mutantLineContent) => {
  return jsDiff.diffChars(lineContent.trim(), mutantLineContent.trim()).map(stringDiff => {
    if (stringDiff.added) return chalk.green(stringDiff.value)
    else if (stringDiff.removed) return chalk.red(stringDiff.value)
    else return chalk.gray(stringDiff.value)
  }).join('')
}
