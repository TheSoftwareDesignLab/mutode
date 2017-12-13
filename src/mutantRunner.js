const fs = require('fs')
const spawn = require('child_process').spawn

module.exports = async function mutantRunner ({cancerInstance, filePath, contentToWrite}) {
  return new Promise((resolve, reject) => {
    fs.writeFileSync(`../cancer-tmp/${filePath}`, contentToWrite)
    const child = spawn('npm', ['test'], {cwd: cancerInstance.tmpPath})
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
    }, cancerInstance.timeout).unref()

    child.on('exit', (code, signal) => {
      clearTimeout(timeout)
      if (code === 0) {
        console.log('survived')
        cancerInstance.survivors++
      } else if (signal) {
        cancerInstance.discarded++
      } else {
        console.log('killed')
        cancerInstance.killed++
      }
      // console.log('exit', code)
      resolve()
    })
  })
}
