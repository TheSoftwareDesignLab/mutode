const test = require('ava')

const Mutode = require('../src/mutode')

const MUTANTS = 74
const KILLED = 54
const SURVIVED = 19
const DISCARDED = 1

process.chdir('./example-module')

const opts = {}

if (process.env.MUTODE_CONCURRENCY) opts.concurrency = process.env.MUTODE_CONCURRENCY

test.serial('Example module', async t => {
  let mutode = new Mutode(opts)
  await mutode.run()
  t.is(mutode.killed + mutode.survived + mutode.discarded, mutode.mutants)
  t.true(mutode.mutants >= MUTANTS)
  t.true(mutode.killed >= KILLED)
  t.true(mutode.survived >= SURVIVED)
  t.true(mutode.discarded >= DISCARDED)
  t.true(mutode.coverage > 50)
  await t.throws(mutode.run())
})

test('Exmaple module - killed', async t => {
  let mutode = new Mutode({
    paths: 'src/killed.js',
    concurrency: 1
  })
  await mutode.run()
  t.is(mutode.mutants, mutode.killed)
  t.is(mutode.coverage, 100)
})

test('Exmaple module - survived', async t => {
  let mutode = new Mutode({
    paths: 'src/survived.js',
    concurrency: 1
  })
  await mutode.run()
  t.is(mutode.mutants, mutode.survived)
  t.is(mutode.coverage, 0)
})

test('Exmaple module - discarded', async t => {
  let mutode = new Mutode({
    paths: 'src/discarded.js',
    concurrency: 1
  })
  await mutode.run()
  t.is(mutode.discarded, DISCARDED)
})
