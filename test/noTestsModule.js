const test = require('ava')
const del = require('del')

const Mutode = require('../src/mutode')

process.chdir('./no-tests-module')
del.sync('.mutode', {force: true})

const opts = {}

if (process.env.MUTODE_CONCURRENCY) opts.concurrency = process.env.MUTODE_CONCURRENCY

test.serial('No tests module', async t => {
  let mutode = new Mutode(opts)
  await t.throws(mutode.run())
})
