module.exports = {
  deletion () {
    return true
  },
  math (n, m) {
    let a = n + m
    let b = n - m
    let c = n * m
    let d = n / m
    let e = n % m
    let f = n | m
    let g = n & m
    let h = n ^ m
    let i = n ** m
    let j = n << m
    let k = n >> m
    return +(a + b + c + d + e + f + g + h + i + j + k).toFixed(1)
  },
  increments (a) {
    a++
    a--
    return a
  },
  conditionals (a) {
    if (a === -1) {
      return 0
    }
    if (a < 2) {
      return a
    }
    if (a <= 3) {
      return a * 2
    }
    if (a >= 7) {
      return a * 3
    }
    if (a > 5) {
      return a * 4
    }
    if (a !== 4) {
      return -1
    }
    return a * 5
  },
  negatives (a) {
    return -a
  },
  stringLiterals: {
    hello () {
      return 'hello'
    },
    empty () {
      return ''
    }
  },
  numericLiterals: {
    zero () {
      return 0
    },
    one () {
      return 1
    },
    ten () {
      return 10
    }
  },
  booleanLiterals: {
    booleanTrue () {
      return true
    },
    booleanFalse () {
      return false
    }
  },
  functions () {
    const b = function () {
      return 2
    }

    function a (p1, p2, p3) {
      return p1 * p2 * p3
    }

    return a(1, 2, 3) * b()
  },
  arrays () {
    const a = [1,2,3]
    const b = [
      4,
      5,
      {
        a: 6,
        b: 7
      }
    ]
    return a.concat(b)
  },
  objects (bool) {
    const a = { a: 1, b: 2}
    const b = {
      a: 3,
      b: [
        4, 5
      ]
    }
    return bool ? a : b
  },
  switchCases(a) {
    switch (a) {
      case 1:
        return 2
      case true:
        return 3
      default:
        return 4
    }
  }
}
