const ApiPort = require('../src/apiPort.js');

describe('apiPort', () => {
    describe('getDataFromFile', () => {
        it('', () => {
            process.env.TEST_DATA_PATH = './fixtures';
            process.env.API_TESTS_PATH = './';
            process.env.OPENAPI_PATH = './fixtures/api-docs.json';
            process.env.CD = '../';
            process.env.API_SERVER_URL = 'http://localhost:8080';
            const apiPort = new ApiPort();
            apiPort.init();
            const data = apiPort.getDataFromFile('fixture.data.yaml');
        });
    });
});
