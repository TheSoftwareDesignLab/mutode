const assert = require('assert')
const killed = require('./src/killed')
const survived = require('./src/survived')
const discarded = require('./src/discarded')

// Deletion
assert.ok(killed.deletion())
assert.ok(survived.deletion())

// Math
assert.strictEqual(killed.math(1, 2), 16.5)
assert.strictEqual(killed.math(2, 1), 21)
assert.strictEqual(killed.math(2, 3), 42.7)
assert.strictEqual(killed.math(3, 2), 41.5)
assert.strictEqual(killed.math(3, 4), 164.8)
assert.strictEqual(killed.math(4, 3), 132.3)
assert.strictEqual(survived.math(2, 3), 2)

// Increments
assert.strictEqual(killed.increments(1), 1)
assert.strictEqual(killed.increments(10), 10)
assert.strictEqual(survived.increments(1), 1)

// Conditionals boundary
assert.strictEqual(killed.condBound(5), 5)
assert.strictEqual(killed.condBound(10), 20)
assert.strictEqual(killed.condBound(15), 30)
assert.strictEqual(killed.condBound(20), 40)
assert.strictEqual(killed.condBound(30), 90)
assert.strictEqual(killed.condBound(27), 108)
assert.strictEqual(killed.condBound(25), 125)
assert.strictEqual(survived.condBound(33), 33)

// Discarded
assert.strictEqual(discarded, true)
