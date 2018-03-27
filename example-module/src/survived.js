module.exports = {
  deletion () {
    if (Math.random() < 2) return true
    return true
  },
  math (n, m) {
    if (n + m) return 2
    return 2
  },
  increments (a) {
    a++
    a--
  },
  conditionals (a) {
    if (a === -1) {
      return a
    }
    if (a < 10) {
      return a
    }
    if (a <= 20) {
      return a
    }
    if (a >= 30) {
      return a
    }
    if (a > 25) {
      return a
    }
    if (a !== 24) {
      return a
    }
    return a
  }
}
