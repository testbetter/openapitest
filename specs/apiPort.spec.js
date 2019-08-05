const ApiPort = require('../src/apiPort.js')
const { expect } = require('chai')

describe('apiPort', () => {
    describe('getDataFromFile', () => {
        it('Should resolve the files and trasform it to an object', () => {
            process.env.TEST_DATA_PATH = './fixtures';
            process.env.API_TESTS_PATH = './';
            process.env.OPENAPI_PATH = './fixtures/api-docs.json';
            process.env.SHARED_TEST_DATA = './openapitest/fixtures';
            process.env.CD = '../';
            process.env.API_SERVER_URL = 'http://localhost:8080';
            const apiPort = new ApiPort();
            apiPort.init();
            const data = apiPort.getDataFromFile('fixture');
            expect(data).to.deep.equal({
                test: 'This is a test'
            })
        })
    })
})
