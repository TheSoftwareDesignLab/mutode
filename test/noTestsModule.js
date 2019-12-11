const test = require('ava')
const del = require('del')

const Mutode = require('../src/mutode')

process.chdir('./no-tests-module')
del.sync('.mutode', { force: true })

test.serial('No tests module', async t => {
  const mutode = new Mutode()
  await t.throws(mutode.run())
})
