const test = require('ava')

const Mutode = require('../src/mutode')

test('New instance - Correct', async t => {
  const mutode = new Mutode()
  t.is(mutode.mutants, 0)
  t.is(mutode.killed, 0)
  t.is(mutode.survived, 0)
  t.is(mutode.discarded, 0)
  t.is(mutode.coverage, 0)
})

test('New instance - Empty paths', async t => {
  t.throws(() => {
    const mutodeFail = new Mutode({ paths: 'hello.js' })
    mutodeFail.run()
  })
})
