const { expect } = require('chai')
const ApiPort = require('../src/apiPort.js')

describe('apiPort', () => {

  before(() => {
    process.env.TEST_DATA_PATH = './fixtures'
    process.env.API_TESTS_PATH = './'
    process.env.OPENAPI_PATH = './fixtures/api-docs.json'
    process.env.SHARED_TEST_DATA = './openapitest/fixtures'
    process.env.CD = '../'
    process.env.API_SERVER_URL = 'http://localhost:8080'
  })

  describe('getDataFromFile', () => {

    it('Should resolve the files and parse yaml into to an object', () => {
      const apiPort = new ApiPort()
      apiPort.init()
      const data = apiPort.getDataFromFile('fixture')
      expect(data).to.deep.equal({
        test: 'This is a test',
        value: 123,
      })
    })
  })

  describe('set', () => {

    it('should set a value and be able to get it', () => {
      const apiPort = new ApiPort()
      apiPort.init()
      apiPort.set('some', 'value')
      expect(apiPort.get('some')).to.be.equal('value');
    })

    it('should not allow undefined values if the value is mandatory', () => {
      const apiPort = new ApiPort()
      apiPort.init()
      expect(() => apiPort.set('some', undefined, true)).to.throw('Value required for: some');
      expect(() => apiPort.set('some', undefined)).to.throw('Value required for: some');
    })

    it('should allow undefined values if the value is not mandatory', () => {
      const apiPort = new ApiPort()
      apiPort.init()
      expect(() => apiPort.set('some', undefined, false)).not.to.throw()
    })
  })
})
