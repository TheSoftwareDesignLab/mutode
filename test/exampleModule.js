const test = require('ava')
const del = require('del')

const Mutode = require('../src/mutode')

const MUTANTS = 74
const KILLED = 54
const SURVIVED = 19
const DISCARDED = 1

process.chdir('./example-module')
del.sync('.mutode', {force: true})

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

test.serial('Exmaple module - killed', async t => {
  let mutode = new Mutode({
    paths: 'src/killed.js',
  })
  await mutode.run()
  t.is(mutode.mutants, mutode.killed)
  t.is(mutode.coverage, 100)
})

test.serial('Exmaple module - survived', async t => {
  let mutode = new Mutode({
    paths: 'src/survived.js',
  })
  await mutode.run()
  t.is(mutode.mutants, mutode.survived)
  t.is(mutode.coverage, 0)
})

test.serial('Exmaple module - discarded', async t => {
  let mutode = new Mutode({
    paths: 'src/discarded.js',
  })
  await mutode.run()
  t.is(mutode.discarded, DISCARDED)
})
