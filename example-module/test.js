const assert = require('assert')
const killed = require('./src/killed')
const survived = require('./src/survived')
const discarded = require('./src/discarded')

// Deletion
assert.ok(killed.deletion())

// Math
assert.strictEqual(killed.math(1, 2), 16.5)
assert.strictEqual(killed.math(2, 1), 21)
assert.strictEqual(killed.math(2, 3), 42.7)
assert.strictEqual(killed.math(3, 2), 41.5)
assert.strictEqual(killed.math(3, 4), 164.8)
assert.strictEqual(killed.math(4, 3), 132.3)

// Increments
assert.strictEqual(killed.increments(1), 1)
assert.strictEqual(killed.increments(10), 10)

// Conditionals
assert.strictEqual(killed.conditionals(-1), 0)
assert.strictEqual(killed.conditionals(5), 5)
assert.strictEqual(killed.conditionals(10), 20)
assert.strictEqual(killed.conditionals(15), 30)
assert.strictEqual(killed.conditionals(20), 40)
assert.strictEqual(killed.conditionals(30), 90)
assert.strictEqual(killed.conditionals(27), 108)
assert.strictEqual(killed.conditionals(25), 125)
assert.strictEqual(killed.conditionals(24), -1)

// Invert negatives
assert.strictEqual(killed.negatives(-1), 1)
assert.strictEqual(killed.negatives(0), 0)
assert.strictEqual(killed.negatives(1), -1)

// Return values
assert.strictEqual(killed.returnValues.numeric(), 7)
assert.strictEqual(killed.returnValues.numericZero(), 0)
assert.strictEqual(killed.returnValues.booleanTrue(), true)
assert.strictEqual(killed.returnValues.booleanFalse(), false)

// Discarded
assert.strictEqual(discarded, true)

// Survived
assert.strictEqual(survived(), undefined)