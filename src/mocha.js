const YAML = require('yamljs')
const ApiPort = require('./apiPort')
const apiCall = require('./apiCall')
const apiTest = require('./apiTests')
const assert = require('assert')
const klawSync = require('klaw-sync')

const apiPort = new ApiPort()
apiPort.init()

if (apiPort.get('API_TESTS_PATH')) {
    let paths = klawSync(apiPort.get('API_TESTS_PATH'), { nodir: true })
    if (paths) {
        paths.forEach(file => {
            const filePath = file.path
            apiPort.currentFile = filePath
            if (filePath.match(/spec\.yaml$/)) {
                const config = YAML.load(filePath)
                describe(filePath, function() {
                    const describeMethod = config.only ? describe.only : describe;
                    describeMethod((config.apiCalls || {}).name || 'unnamed', function test() {
                        if (!(config.apiCalls || {}).name) {
                            it('suite should have a name', function() {
                                assert.fail()
                            })
                        }
                        this.timeout(apiPort.get('TIMEOUT'))
                        before(done => {
                            apiPort.reset()
                            done()
                        })

                        apiCall(filePath, apiPort)
                        apiTest(filePath, apiPort)

                        after(done => {
                            apiPort.reset()
                            done()
                        })
                    })
                })
            }
        })
    }
} else {
    console.error('Did not find any test-spec folder.')
}