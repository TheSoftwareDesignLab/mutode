const test = require('ava')

const Mutode = require('../src/mutode')

process.chdir('./example-module')

const opts = {}

if (process.env.MUTODE_CONCURRENCY) opts.concurrency = process.env.MUTODE_CONCURRENCY

let mutode = new Mutode(opts)

test('Example module', async t => {
  t.is(mutode.coverage, 0)
  await mutode.run()
  t.true(mutode.killed > 0)
  t.true(mutode.survived > 0)
  t.true(mutode.discarded > 0)
  t.true(mutode.coverage > 0)
})

test('Empty paths', async t => {
  t.is(mutode.coverage, 0)
  t.throws(() => {
    const mutodeFail = new Mutode({paths: 'hello.js'})
    mutode.run()
  })
})
