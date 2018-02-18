const fs = require('fs')
const spawn = require('child_process').spawn

module.exports = async function mutantRunner ({mutodeInstance, filePath, contentToWrite, index}) {
  return new Promise((resolve, reject) => {
    fs.writeFileSync(`../mutode-${index}/${filePath}`, contentToWrite)
    const child = spawn('npm', ['test'], {cwd: mutodeInstance.tmpPath})
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
      console.log('discarded (timeout)')
      child.kill('SIGKILL')
    }, mutodeInstance.timeout).unref()

    child.on('exit', (code, signal) => {
      clearTimeout(timeout)
      if (code === 0) {
        console.log('survived')
        mutodeInstance.survivors++
      } else if (signal) {
        mutodeInstance.discarded++
      } else {
        console.log('killed')
        mutodeInstance.killed++
      }
      // console.log('exit', code)
      resolve()
    })
  })
}
