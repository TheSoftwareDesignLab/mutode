const test = require('ava')
const del = require('del')

const Mutode = require('../src/mutode')

const MUTANTS = 74
const KILLED = 54
const SURVIVED = 4
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
  const testOpts = Object.assign({
    paths: 'src/killed.js'
  }, opts)
  let mutode = new Mutode(testOpts)
  await mutode.run()
  t.is(mutode.mutants, mutode.killed)
  t.is(mutode.coverage, 100)
})

test.serial('Exmaple module - survived', async t => {
  const testOpts = Object.assign({
    paths: 'src/survived.js'
  }, opts)
  let mutode = new Mutode(testOpts)
  await mutode.run()
  t.is(mutode.mutants, mutode.survived)
  t.is(mutode.coverage, 0)
})

test.serial('Exmaple module - discarded', async t => {
  const testOpts = Object.assign({
    paths: 'src/discarded.js'
  }, opts)
  let mutode = new Mutode(testOpts)
  await mutode.run()
  t.is(mutode.discarded, DISCARDED)
})

test.serial('Exmaple module - no mutants', async t => {
  let mutode = new Mutode({
    paths: 'src/discarded.js',
    mutators: 'invertNegatives',
    concurrency: 1
  })
  await mutode.run()
  t.is(mutode.mutants, 0)
})
