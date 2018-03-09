module.exports = {
  deletion () {
    console.log('returning true')
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
  condBound (a) {
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
    return a * 5
  }
}
