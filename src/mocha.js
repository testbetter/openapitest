const assert = require('assert');
const klawSync = require('klaw-sync');
const ApiPort = require('./apiPort');
const apiCall = require('./apiCall');
const apiTest = require('./apiTests');
const { loadYamlFile } = require('./util.js');

const apiPort = new ApiPort();
apiPort.init();

let tagsArray = [];
if (process.env.TAGS) {
  tagsArray = process.env.TAGS.split(',');
}

if (apiPort.get('API_TESTS_PATH')) {
  const paths = klawSync(apiPort.get('API_TESTS_PATH'), { nodir: true });
  if (paths) {
    paths.forEach((file) => {
      const filePath = file.path;
      apiPort.currentFile = '';
      if (filePath.match(/spec\.yaml$/)) {
        apiPort.currentFile = filePath;
        const config = loadYamlFile(filePath);
        describe(filePath, () => {
          let tagsInTest = [];
          if (tagsInTest) {
            if (!Array.isArray(config.apiCalls.tag)) {
              tagsInTest = [config.apiCalls.tag];
            } else {
              tagsInTest = config.apiCalls.tag;
            }
          }
          if (tagsArray.length > 0) {
            let tagMatched = false;
            for (const tagInArgs of tagsArray) {
              for (const tagInTest of tagsInTest) {
                if (`${tagInArgs}` === `${tagInTest}`) {
                  tagMatched = true;
                  break;
                }
              }
              if (tagMatched) {
                break;
              }
            }

            if (!tagMatched) {
              console.error(`The tags ${config.apiCalls.tag || 'empty'} in file: ${filePath} does not match the expected tags: ${tagsArray || 'empty'}`);
              return false;
            }
          }

          const describeMethod = config.only ? describe.only : describe;
          describeMethod(
            (config.apiCalls || {}).name || 'unnamed',
            function test() {
              if (!(config.apiCalls || {}).name) {
                it('suite should have a name', () => {
                  assert.fail();
                });
              }
              this.timeout(apiPort.get('TIMEOUT'));
              before((done) => {
                apiPort.reset();
                done();
              });

              apiCall(filePath, apiPort);
              apiTest(filePath, apiPort);

              after((done) => {
                apiPort.reset();
                done();
              });
            },
          );
        });
      }
    });
  }
} else {
  console.error('Did not find any test-spec folder.');
}
