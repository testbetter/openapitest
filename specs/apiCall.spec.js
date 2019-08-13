const {
  expect,
} = require('chai')

const { first } = require('lodash')

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
      const apiCalls = first(apiCallConfig.apiCalls)
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
        expects: [
          {
            'userResponse.message': 'to.be User logged Successfully',
          },
        ],
      })
    })


    it('Should evaluate global fake data', () => {
      const apiCallConfig = new ApiCall('./fixtures/fixture.spec.yaml', apiPort);
      const apiCall = first(apiCallConfig.apiCalls)
      const body = apiCall.data
      expect(body.email).to.be.a('string')
      expect(body.password).not.to.be.a('string')
    })

  })
})
