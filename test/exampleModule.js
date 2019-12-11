const test = require('ava')
const del = require('del')

const Mutode = require('../src/mutode')

process.chdir('./example-module')
del.sync('.mutode', { force: true })

const opts = {}

if (process.env.MUTODE_CONCURRENCY) opts.concurrency = process.env.MUTODE_CONCURRENCY

test.serial('Exmaple module - killed', async t => {
  const testOpts = Object.assign({
    paths: ['src/killed.js', 'src/killed-dep.js']
  }, opts)
  const mutode = new Mutode(testOpts)
  await mutode.run()
  t.is(mutode.killed + mutode.survived + mutode.discarded, mutode.mutants)
  t.is(mutode.mutants, mutode.killed)
  t.is(mutode.coverage, 100)
  await t.throws(mutode.run())
})

test.serial('Exmaple module - survived', async t => {
  const testOpts = Object.assign({
    paths: 'src/survived.js'
  }, opts)
  const mutode = new Mutode(testOpts)
  await mutode.run()
  t.is(mutode.killed + mutode.survived + mutode.discarded, mutode.mutants)
  t.is(mutode.mutants, mutode.survived)
  t.is(mutode.coverage, 0)
  await t.throws(mutode.run())
})

test.serial('Exmaple module - discarded', async t => {
  const testOpts = Object.assign({
    paths: 'src/discarded.js'
  }, opts)
  const mutode = new Mutode(testOpts)
  await mutode.run()
  t.is(mutode.killed + mutode.survived + mutode.discarded, mutode.mutants)
  t.is(mutode.discarded, 1)
  await t.throws(mutode.run())
})

test.serial('Exmaple module - no AST', async t => {
  const mutode = new Mutode({
    paths: 'src/no-ast.js',
    concurrency: 1
  })
  await t.throws(mutode.run())
})

test.serial('Exmaple module - no mutants', async t => {
  const mutode = new Mutode({
    paths: 'src/discarded.js',
    mutators: 'invertNegatives',
    concurrency: 1
  })
  await mutode.run()
  t.is(mutode.killed + mutode.survived + mutode.discarded, mutode.mutants)
  t.is(mutode.mutants, 0)
  await t.throws(mutode.run())
})
