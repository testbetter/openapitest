const {
  expect,
} = require('chai')
const {
  first,
} = require('lodash')
const sinon = require('sinon')

const ApiPort = require('../src/apiPort.js')
const ApiCall = require('../src/apiCall.js')

describe('apiCall', () => {
  let apiPort;

  before(() => {
    process.env.TEST_DATA_PATH = './fixtures'
    process.env.API_TESTS_PATH = './'
    process.env.OPENAPI_PATH = './fixtures/api-docs.json'
    process.env.SHARED_TEST_DATA = './openapitest/fixtures'
    process.env.CD = '../'
    process.env.API_SERVER_URL = 'http://localhost:8080'
    apiPort = new ApiPort()
    apiPort.init()
  })

  describe('init', () => {
    it('Should load file property', () => {
      const apiCallConfig = new ApiCall('./fixtures/fixture.spec.yaml', apiPort);
      const apiCalls = first(apiCallConfig.apiCalls.swagger)
      const test = first(apiCallConfig.tests)

      expect(apiCalls).to.deep.include({
        name: 'Login - success',
        call: 'post_users_login',
        header: {
          'Content-Type': 'application/json',
        },
        expect: {
          status: 200,
          json: [{
            'user.status': 'ENABLED',
          }],
        },
        save: {
          userResponse: 'json',
        },
      })

      expect(test).to.deep.include({
        name: 'Checking login response',
        expects: [{
          'userResponse.message': 'to.be User logged Successfully',
        }],
      })
    })


    it('Should evaluate global fake data', () => {
      const apiCallConfig = new ApiCall('./fixtures/fixture.spec.yaml', apiPort);
      const apiCall = first(apiCallConfig.apiCalls.swagger)
      const body = apiCall.data
      expect(body.email).to.be.a('string')
      expect(body.email).not.to.have.string('!faker')

      expect(body.password).not.to.be.a('string')
    })


    it('Should repeat the file if the repeat tag is present change the it text', () => {
      const fakeIt = sinon.spy()
      ApiCall('./fixtures/fixture.repeat.spec.yaml', apiPort, fakeIt)
      sinon.assert.callCount(fakeIt, 3)
      sinon.assert.calledWith(fakeIt, 'Login - success - 1')
      sinon.assert.calledWith(fakeIt, 'Login - success - 2')
      sinon.assert.calledWith(fakeIt, 'Login - success - 3')
    })

    it('Should call the only method if the only tag is present', () => {
      const fakeOnly = sinon.spy()
      const fakeSkip = sinon.spy()
      ApiCall('./fixtures/fixture.only.spec.yaml', apiPort, {
        skip: fakeSkip,
        only: fakeOnly,
      })
      sinon.assert.calledWith(fakeOnly, 'Login - success')
      sinon.assert.notCalled(fakeSkip)
    })

    it('Should call the skip method if the skip tag is present', () => {
      const fakeSkip = sinon.spy()
      const fakeOnly = sinon.spy()
      ApiCall('./fixtures/fixture.skip.spec.yaml', apiPort, {
        skip: fakeSkip,
        only: fakeOnly,
      })
      sinon.assert.calledWith(fakeSkip, 'Login - success')
      sinon.assert.notCalled(fakeOnly)
    })
  })
})
