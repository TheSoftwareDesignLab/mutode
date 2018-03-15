const test = require('ava')

const Mutode = require('../src/mutode')

process.chdir('./example-module')

const opts = {}

if (process.env.MUTODE_CONCURRENCY) opts.concurrency = process.env.MUTODE_CONCURRENCY

test('Example module', async t => {
  let mutode = new Mutode(opts)
  t.is(mutode.mutants, 0)
  t.is(mutode.killed, 0)
  t.is(mutode.survived, 0)
  t.is(mutode.discarded, 0)
  t.is(mutode.coverage, 0)
  await mutode.run()
  t.is(mutode.mutants, 73)
  t.is(mutode.killed + mutode.survived + mutode.discarded, mutode.mutants)
  t.true(mutode.killed >= 53)
  t.true(mutode.survived >= 19)
  t.true(mutode.discarded >= 1)
  t.true(mutode.coverage > 50)
})

test('Empty paths', async t => {
  t.throws(() => {
    const mutodeFail = new Mutode({paths: 'hello.js'})
    mutodeFail.run()
  })
})
