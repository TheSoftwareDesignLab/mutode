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
    if (a < 10) {
      return a
    }
    if (a <= 20) {
      return a * 2
    }
    if (a >= 30) {
      return a * 3
    }
    if (a > 25) {
      return a * 4
    }
    if (a !== 25) {
      return -1
    }
    return a * 5
  },
  negatives (a) {
    return -a
  },
  returnValues: {
    numeric () {
      return 7
    },
    numericZero () {
      return 0
    },
    booleanTrue () {
      return true
    },
    booleanFalse () {
      return false
    },
    string () {
      return 'hello'
    },
    emptyString () {
      return ''
    }
  },
  switchCases (a) {
    switch (a) {
      case 0:
        return 1
      case 1:
        return 2
      case 'a':
        return 3
      case '':
        return 4
      case true:
        return 5
      case false:
        return 6
      default:
        return 10
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
  }
}
