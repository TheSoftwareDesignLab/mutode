const spawn = require('child_process').spawn
const fs = require('fs')
const path = require('path')

module.exports = function mutantRunner ({mutodeInstance, filePath, contentToWrite, log}) {
  return async index => {
    await new Promise((resolve, reject) => {
      fs.writeFileSync(`../mutode-${index}/${filePath}`, contentToWrite)
      const child = spawn('npm', ['test'], {cwd: path.resolve(`../mutode-${index}`)})
      // child.stdout.on('data', d => {
      // console.log(d.toString())
      // })

      // child.stderr.on('data', err => {
      // console.error(err.toString())
      // })

      // child.on('error', e => {
      //   console.error('ERROR', e)
      // })

      const timeout = setTimeout(() => {
        console.log(`${log} discarded (timeout)`)
        child.kill('SIGKILL')
      }, mutodeInstance.timeout).unref()

      child.on('exit', (code, signal) => {
        clearTimeout(timeout)
        if (code === 0) {
          console.log(`${log} survived`)
          mutodeInstance.survivors++
        } else if (signal) {
          mutodeInstance.discarded++
        } else {
          console.log(`${log} killed`)
          mutodeInstance.killed++
        }
        // console.log('exit', code)
        resolve()
      })
    })
  }
}
