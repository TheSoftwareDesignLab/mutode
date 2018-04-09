const walk = require('babylon-walk')
const debug = require('debug')('mutode:removeSwitchCasesMutator')

const mutantRunner = require('../mutantRunner')

/**
 * @description Mutates switch statement by removing cases
 * @function removeSwitchCasesMutator
 * @memberOf module:Mutators
 */
module.exports = async function removeSwitchCasesMutator ({mutodeInstance, filePath, lines, queue, ast}) {
  debug('Running remove switch cases mutator on %s', filePath)

  walk.simple(ast, {
    SwitchCase (node) {
      const line = node.loc.start.line
      const caseContent = node.test ? node.test.extra ? node.test.extra.raw : `${node.test.value}` : 'default'

      const mutantId = ++mutodeInstance.mutants
      const log = `MUTANT ${mutantId}:\tRSCM Lines ${node.loc.start.line}-${node.loc.end.line}: Commented case ${caseContent}`
      debug(log)
      mutodeInstance.mutantLog(log)
      const linesCopy = lines.slice()
      for (let i = line - 1; i < node.loc.end.line; i++) {
        linesCopy[i] = `// ${linesCopy[i]}`
      }
      const contentToWrite = linesCopy.join('\n')
      queue.push(mutantRunner({mutodeInstance, filePath, contentToWrite, log}))
    }
  })
}
