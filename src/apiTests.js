const { loadYamlFile } = require('./util.js')

module.exports = function tests(file, apiPort) {
  const config = init(file)

  config.tests.forEach((test, index) => {
    if (!test.name) {
      it(`Test #${index + 1} in ${file}`, () => {
        throw new Error('Tests must have a name.')
      })
      return
    }

    it(apiPort.resolve(test.name), () => {
      if (!test.expects) {
        throw new Error('Test must have at least one expect statement')
      }

      for (const expect of test.expects) {
        apiPort.expectationOn(apiPort.apiPort, expect)
      }
    })
  })
}

function init(file) {
  const fileContent = loadYamlFile(file)

  fileContent.apiCalls = fileContent.apiCalls || {}
  fileContent.tests = fileContent.tests || []
  fileContent.name = fileContent.name || 'unnamed'

  return fileContent
}
