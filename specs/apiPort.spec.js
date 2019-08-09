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
  describe('resolve', () => {
    /* eslint-disable no-template-curly-in-string */
    it('should handle tokens properly', () => {
      const apiPOrt = new ApiPort()
      apiPOrt.set('numToken', 555)
      apiPOrt.set('boolToken', true)
      apiPOrt.set('strToken', 'this is a token')

      expect(apiPOrt.resolve('${numToken}')).to.be.equal(555)
      expect(apiPOrt.resolve('${boolToken}')).to.be.equal(true)
      expect(apiPOrt.resolve('${strToken}')).to.be.equal('this is a token')

      expect(apiPOrt.resolve('Hello ${strToken} ${numToken} - ${boolToken}')).to.be.equal('Hello this is a token 555 - true')
    })
    it('should return data as is', () => {
      const apiPOrt = new ApiPort()

      expect(apiPOrt.resolve(444)).to.be.equal(444)
      expect(apiPOrt.resolve(true)).to.be.equal(true)
      expect(apiPOrt.resolve('hello')).to.be.equal('hello')
      const coord = { x: 5, y: 10 }
      expect(apiPOrt.resolve(coord)).to.be.equal(coord)
    })
    it('should throw when token is not found', () => {
      const apiPort = new ApiPort()

      expect(() => apiPort.resolve('Will not find ${this}')).to.throw(/this.*not found/)
      expect(() => apiPort.resolve('Will not find ${coord.x}')).to.throw(/coord.x.*not found/)
    })
    it('should throw if object is embedded in string', () => {
      const apiPort = new ApiPort()
      apiPort.set('coord', { x: 5, y: 10 })

      expect(() => apiPort.resolve('This is not supported: ${coord}')).to.throw(/Cannot set object.*coord/)
    })
    it('should lookup object data', () => {
      const apiPort = new ApiPort()
      apiPort.set('coord', { x: 5, y: 10 })

      expect(apiPort.resolve('${coord.x}')).to.be.equal(5)
      expect(apiPort.resolve('The coords are: ${coord.x}, ${coord.y}')).to.be.equal('The coords are: 5, 10')
      // will return the object as an object
      expect(apiPort.resolve('${coord}')).to.be.eql({ x: 5, y: 10 })
    })
  })
  describe('expectations', () => {
    it('should parse properly', () => {
      const apiPort = new ApiPort()
      const json = {
        deployment: 'hello',
        active: { is: 'an object' },
      }

      apiPort.expectationOn(json, { deployment: 'hello' })
      apiPort.expectationOn(json, { 'deployment.length': 5 })
      apiPort.expectationOn(json, { deployment: 'to.be.equal hello' })
      apiPort.expectationOn(json, { isUndefined: 'to.not.be.ok' })
    })
    it('should throw expected exceptions properly', () => {
      const apiPort = new ApiPort()
      const json = {
        deployment: 'hello',
        active: { is: 'an object' },
      }

      expect(() => apiPort.expectationOn(json, { deployment: 'helloX' })).to.throw(/expected.*hello.*helloX/)
      expect(() => apiPort.expectationOn(json, { 'deployment.length': 6 })).to.throw(/expected.*5.*6/)
      expect(() => apiPort.expectationOn(json, { deployment: 'to.be.equal helloX' })).to.throw(/expected.*hello.*helloX/)
      expect(() => apiPort.expectationOn(json, { isUndefined: 'to.be.ok' })).to.throw(/expected.*undefined.*truthy/)
    })
  })
})
