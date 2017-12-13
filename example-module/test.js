const assert = require('assert')
const em = require('./index')

assert.ok(em.deletion())

assert.strictEqual(em.math(1, 2), 16.5)
assert.strictEqual(em.math(2, 1), 21)
assert.strictEqual(em.math(2, 3), 42.7)
assert.strictEqual(em.math(3, 2), 41.5)
assert.strictEqual(em.math(3, 4), 164.8)
assert.strictEqual(em.math(4, 3), 132.3)
