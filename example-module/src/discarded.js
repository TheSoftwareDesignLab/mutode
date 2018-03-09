const to = setTimeout(() => { console.log('timeout') }, 6000)
to.unref()

module.exports = true
