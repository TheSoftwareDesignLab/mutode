const jsDiff = require('diff')
const chalk = require('chalk')

module.exports = (lineContent, mutantLineContent) => {
  return jsDiff.diffWords(lineContent.trim(), mutantLineContent.trim()).map(stringDiff => {
    if (stringDiff.added) return chalk.bgGreen(stringDiff.value)
    else if (stringDiff.removed) return chalk.bgRed(stringDiff.value)
    else return chalk.inverse(stringDiff.value)
  }).join('')
}
