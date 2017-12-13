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
    a++
    a--
    return +(a + b + c + d + e + f + g + h + i + j + k).toFixed(1)
  }
}
