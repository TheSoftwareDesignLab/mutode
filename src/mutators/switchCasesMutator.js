const walk = require('babylon-walk')
const debug = require('debug')('mutode:incrementsMutator')

const mutantRunner = require('../mutantRunner')
const lineDiff = require('../util/lineDiff')

/**
 * @description Mutates switch cases test values.
 * Negates booleans.
 * Numbers > 0 are mutated to 0, 0 is mutated to 1.
 * String are mutated to a random string.
 * @function switchCasesMutator
 * @memberOf module:Mutators
 */
module.exports = async function switchCasesMutator ({mutodeInstance, filePath, lines, queue, ast}) {
  debug('Running switch cases mutator on %s', filePath)

  walk.simple(ast, {
    SwitchCase (node) {
      const line = node.loc.start.line
      const lineContent = lines[line - 1]
      let mutantLineContent = lineContent
      if (!node.test) return
      switch (node.test.type) {
        case 'BooleanLiteral': {
          const newCaseValue = !node.test.value
          mutantLineContent = lineContent.substr(0, node.test.loc.start.column) +
            newCaseValue +
            lineContent.substr(node.test.loc.end.column)
          break
        }
        case 'NumericLiteral': {
          const newCaseValue = node.test.value === 0 ? 1 : 0
          mutantLineContent = lineContent.substr(0, node.test.loc.start.column) +
            newCaseValue +
            lineContent.substr(node.test.loc.end.column)
          break
        }
        case 'StringLiteral': {
          const newCaseValue = `'${Math.random().toString(36).replace(/[^a-z]+/g, '')}'`
          mutantLineContent = lineContent.substr(0, node.test.loc.start.column) +
            newCaseValue +
            lineContent.substr(node.test.loc.end.column)
          break
        }
      }

      const mutantId = ++mutodeInstance.mutants
      const diff = lineDiff(lineContent, mutantLineContent)
      const log = `MUTANT ${mutantId}:\tSCM Line ${line}:\t${diff}...`
      debug(log)
      mutodeInstance.mutantLog(`MUTANT ${mutantId}:\tSCM ${filePath} Line ${line}:\t\`${lineContent.trim()}\` > \`${mutantLineContent.trim()}'\``)
      const linesCopy = lines.slice()
      linesCopy[line - 1] = mutantLineContent
      const contentToWrite = linesCopy.join('\n')
      queue.push(mutantRunner({mutodeInstance, filePath, contentToWrite, log}))
    }
  })
}
