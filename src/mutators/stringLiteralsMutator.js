const walk = require('babylon-walk')
const debug = require('debug')('mutode:stringLiteralsMutator')

const mutantRunner = require('../mutantRunner')
const lineDiff = require('../util/lineDiff')

/**
 * @description Mutates string literals values.
 * String are mutated to a random string and to an empty string. Empty string are mutated to a random string.
 * @function stringLiteralsMutator
 * @memberOf module:Mutators
 */
module.exports = async function stringLiteralsMutator ({mutodeInstance, filePath, lines, queue, ast}) {
  debug('Running string literals mutator on %s', filePath)

  walk.ancestor(ast, {
    StringLiteral (node, state, ancestors) {
      const line = node.loc.start.line
      const lineContent = lines[line - 1]

      if (ancestors.length >= 2) {
        const ancestor = ancestors[ancestors.length - 2]
        if (ancestor.type && ancestor.type === 'CallExpression' && ancestor.callee) {
          if (ancestor.callee.type === 'MemberExpression' && ancestor.callee.object.name === 'console') return
          if (ancestor.callee.name) {
            switch (ancestor.callee.name) {
              case 'require':
              case 'debug':
                return
              default:
                break
            }
          }
        }
      }

      if (node.value.length !== 0) {
        const mutantLineContent = lineContent.substr(0, node.loc.start.column) +
          node.extra.raw.replace(node.value, '') +
          lineContent.substr(node.loc.end.column)

        const mutantId = ++mutodeInstance.mutants
        const diff = lineDiff(lineContent, mutantLineContent)
        const log = `MUTANT ${mutantId}:\tSLM Line ${line}:\t${diff}...`
        debug(log)
        mutodeInstance.mutantLog(`MUTANT ${mutantId}:\tSLM ${filePath} Line ${line}:\t\`${lineContent.trim()}\` > \`${mutantLineContent.trim()}'\``)
        const linesCopy = lines.slice()
        linesCopy[line - 1] = mutantLineContent
        const contentToWrite = linesCopy.join('\n')
        queue.push(mutantRunner({mutodeInstance, filePath, contentToWrite, log}))
      }

      const newValue = `'${randomString(node.value.length || 10)}'`
      const mutantLineContent = lineContent.substr(0, node.loc.start.column) +
        newValue +
        lineContent.substr(node.loc.end.column)

      const mutantId = ++mutodeInstance.mutants
      const diff = lineDiff(lineContent, mutantLineContent)
      const log = `MUTANT ${mutantId}:\tSLM Line ${line}:\t${diff}...`
      debug(log)
      mutodeInstance.mutantLog(`MUTANT ${mutantId}:\tSLM ${filePath} Line ${line}:\t\`${lineContent.trim()}\` > \`${mutantLineContent.trim()}'\``)
      const linesCopy = lines.slice()
      linesCopy[line - 1] = mutantLineContent
      const contentToWrite = linesCopy.join('\n')
      queue.push(mutantRunner({mutodeInstance, filePath, contentToWrite, log}))
    }
  })
}

function randomString (length) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'
  let randomstring = ''
  for (let i = 0; i < length; i++) {
    const ind = Math.floor(Math.random() * chars.length)
    randomstring += chars.charAt(ind)
  }
  return randomstring
}
