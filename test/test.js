const test = require('ava')

const Cancer = require('../src/cancer')

process.chdir('./example-module')

const mutator = new Cancer('index.js')

test(async t => {
  t.is(mutator.coverage, 0)
  await mutator.run()
  t.is(mutator.coverage, 100)
})
