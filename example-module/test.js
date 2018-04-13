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
assert.strictEqual(killed.conditionals(0), 0)
assert.strictEqual(killed.conditionals(1), 1)
assert.strictEqual(killed.conditionals(2), 4)
assert.strictEqual(killed.conditionals(3), 6)
assert.strictEqual(killed.conditionals(4), 20)
assert.strictEqual(killed.conditionals(5), -1)
assert.strictEqual(killed.conditionals(6), 24)
assert.strictEqual(killed.conditionals(7), 21)

// Invert negatives
assert.strictEqual(killed.negatives(-1), 1)
assert.strictEqual(killed.negatives(0), 0)
assert.strictEqual(killed.negatives(1), -1)

// String literals
assert.strictEqual(killed.stringLiterals.hello(), 'hello')
assert.strictEqual(killed.stringLiterals.empty(), '')

// Numeric literals
assert.strictEqual(killed.numericLiterals.zero(), 0)
assert.strictEqual(killed.numericLiterals.one(), 1)
assert.strictEqual(killed.numericLiterals.ten(), 10)

// Boolean literals
assert.strictEqual(killed.booleanLiterals.booleanTrue(), true)
assert.strictEqual(killed.booleanLiterals.booleanFalse(), false)

// Functions
assert.strictEqual(killed.functions(), 12)

// Arrays
assert.deepEqual(killed.arrays(), [1, 2, 3, 4, 5, {a: 6, b: 7}])

// Objects
assert.deepEqual(killed.objects(true), {a: 1, b: 2})
assert.deepEqual(killed.objects(false), {a: 3, b: [4, 5]})

// Switch cases
assert.deepEqual(killed.switchCases(1), 2)
assert.deepEqual(killed.switchCases(true), 3)
assert.deepEqual(killed.switchCases('hello'), 4)

// Discarded
assert.deepEqual(discarded, {})

// Survived
assert.strictEqual(survived, undefined)