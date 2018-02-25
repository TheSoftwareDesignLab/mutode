const test = require('ava')

const Mutode = require('../src/mutode')

process.chdir('./example-module')

const opts = {}

if (process.env.MUTODE_CONCURRENCY) opts.concurrency = process.env.MUTODE_CONCURRENCY

const mutator = new Mutode(opts)

test(async t => {
  t.is(mutator.coverage, 0)
  await mutator.run()
  t.is(mutator.coverage, 100)
})
