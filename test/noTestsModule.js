const test = require('ava')

const Mutode = require('../src/mutode')

process.chdir('./no-tests-module')

const opts = {}

if (process.env.MUTODE_CONCURRENCY) opts.concurrency = process.env.MUTODE_CONCURRENCY

test.serial('No tests module', async t => {
  let mutode = new Mutode(opts)
  await t.throws(mutode.run())
})
