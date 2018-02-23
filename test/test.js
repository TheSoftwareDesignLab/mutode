const test = require('ava')

const Mutode = require('../src/mutode')

process.chdir('./example-module')

const mutator = new Mutode({paths: 'index.js', concurrency: 4})

test(async t => {
  t.is(mutator.coverage, 0)
  await mutator.run()
  t.is(mutator.coverage, 100)
})
