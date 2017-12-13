const {parse} = require('babylon')
const generator = require('babel-generator').default
const fs = require('fs')

const code = fs.readFileSync('./index.js').toString()
console.log(code)

const ast = parse(code)

const output = generator(ast, { /* options */ }, code)

console.log(output.code)
