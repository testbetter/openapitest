/* eslint-disable max-len */
const _ = require('lodash');
const objectPath = require('object-path');
const { expect } = require('chai');

const tryer = require('tryer');
const { loadYamlFile } = require('./util.js');
const { evaluateFaker, fakerScopes } = require('./customTypes/faker.js');
const SuperClient = require('./superClient');

const processedExpectations = ['status', 'json', 'headers', 'error'];

function getItFunction(req, itApi = it) {
  const useOnly = req.only;
  const useSkip = req.skip;
  let itMethod = itApi;
  if (useOnly) {
    itMethod = itApi.only;
  }

  if (useSkip) {
    itMethod = itApi.skip;
  }
  return itMethod;
}

function getItName(req) {
  return req.name || req.call;
}

module.exports = function apiCall(file, apiPort, itApi = it) {
  const config = init(file);
  const openSpec = apiPort.get('OPENAPI_SPEC');
  const operations = apiPort.get('OPENAPI_OPERATIONS');

  const { paths, ...remainingSpec } = openSpec;
  const operationIds = {};

  _.forEach(paths, (actions, route) => {
    _.forEach(actions, (details, action) => {
      operationIds[details.operationId] = Object.assign({}, remainingSpec, {
        paths: {
          [route]: {
            [action]: details,
          },
        },
      });
    });
  });

  const fileEvaluator = _.ary(
    _.partialRight(evaluateFaker, fakerScopes.file),
    1,
  );

  const swaggerParsed = config.apiCalls.swagger.map(fileEvaluator);

  swaggerParsed.forEach((reqParams) => {
    const repeat = reqParams.repeat || 1;
    const requests = _.times(repeat).map(() => _.clone(reqParams));

    requests.forEach((req, i) => {
      const name = getItName(req);
      req.itText = repeat === 1 ? name : `${name} - ${i + 1}`;
    });

    requests.forEach((_req) => {
      const itMethod = getItFunction(_req, itApi);

      itMethod(_req.itText, async function itFn() {
        const req = evaluateFaker(_req, fakerScopes.test);
        this.timeout(apiPort.get('TIMEOUT'));

        if (!operationIds[req.call]) {
          throw new Error(
            `No swagger operation exists with operationId "${req.call}"`,
          );
        }

        const params = req.parameters || '';
        if (params) {
          apiPort.validateParams(operations[req.call].parameters || [], params);
        }

        let allReqData = {};
        const reqData = req.data || {};
        let basicAuth = req.basicAuth || {};
        if (basicAuth.$file) {
          basicAuth = apiPort.getDataFromFile(basicAuth.$file, file);
          basicAuth = apiPort.resolveObject(basicAuth);
          delete basicAuth.$file;
        }

        req.header = apiPort.resolveObject(req.header);
        apiPort.resolveObject(req.query);

        if (reqData.$file) {
          const reqDataFile = apiPort.getDataFromFile(reqData.$file, file);
          allReqData = apiPort.resolveObject(reqDataFile);
          delete reqData.$file;
        } else {
          allReqData = apiPort.resolveObject(reqData);
        }

        const isResPrint = req.print || false;
        const save = req.save || {};

        const conditions = req.conditions || false;
        const utilConditions = _.get(conditions, 'util', false);
        const interval = _.get(utilConditions, 'interval', 1000);
        const limit = _.get(utilConditions, 'limit', 1);
        const untilExpects = _.get(utilConditions, 'expect', []);
        let res = {};
        let isUntilConditionTrue = false;

        try {
          allReqData = evaluateFaker(allReqData, fakerScopes.test);
          callBefore(apiPort, config, operations, allReqData, basicAuth, req);

          if (utilConditions) {
            tryer({
              action(done) {
                const scResponse = SuperClient(
                  apiPort,
                  req,
                  operations[req.call],
                  allReqData,
                  basicAuth,
                  true,
                )
                done();
                scResponse.then((response) => {
                  varDump('testRes = ', response, true);
                  res = response;
                  res = addJsonToRes(res);

                  const isJsonExpectMeet = apiPort.expectObject(res.json, untilExpects.json)
                  const headersExpect = _.get(untilExpects, 'headers', false);
                  let isHeadersExpectMeet = true;
                  if (headersExpect) {
                    isHeadersExpectMeet = apiPort.expectObject(res.header, headersExpect)
                  }
                  varDump('', isJsonExpectMeet, false);
                  // varDump(isHeadersExpectMeet);
                  if (isJsonExpectMeet && isHeadersExpectMeet) {
                    isUntilConditionTrue = true;
                    successRes(apiPort, config, operations, allReqData, basicAuth, save, req, res, isResPrint);
                  }
                });
              },
              until: () => isUntilConditionTrue,
              interval,
              limit,
            });
            // successRes(apiPort, config, operations, allReqData, basicAuth, save, req, res, isResPrint);
          } else {
            res = await SuperClient(
              apiPort,
              req,
              operations[req.call],
              allReqData,
              basicAuth,
            );
            res = addJsonToRes(res);
            successRes(apiPort, config, operations, allReqData, basicAuth, save, req, res, isResPrint);
          }
        } catch (err) {
          callAfter(apiPort, config, operations, allReqData, basicAuth, req, res, true, err);
          printRes(isResPrint, err, 'Error= ');
          saveErrorResItem(apiPort, save, isResPrint);
          assertExpectForError(apiPort, req, err);
        }
      });
    });
  });
  return config;
};

function successRes(apiPort, config, operations, allReqData, basicAuth, save, req, res, isResPrint) {
  varDump('sucess res calling....', '', false);
  callAfter(apiPort, config, operations, allReqData, basicAuth, req, res);
  printRes(isResPrint, res);
  assertExpect(apiPort, req, res);
  saveResItem(apiPort, save, res, isResPrint);
}

function addJsonToRes(res) {
  if (res.text && isJson(res.text)) {
    res.json = JSON.parse(res.text);
  }

  return res;
}

function callAfter(apiPort, config, operations, allReqData, basicAuth, req, res, isError = false, err = {}) {
  if (req.after && _.isFunction(req.after)) {
    req.after.call(req, {
      apiPort,
      specs: config.apiCalls.swagger,
      res: isError ? {} : res,
      expect,
      op: operations[req.call],
      body: allReqData,
      error: isError ? err : {},
      basicAuth,
    });
  }
}

function callBefore(apiPort, config, operations, allReqData, basicAuth, req) {
  if (req.before && _.isFunction(req.before)) {
    req.before.call(req, {
      apiPort,
      expect,
      specs: config.apiCalls.swagger,
      op: operations[req.call],
      body: allReqData,
      basicAuth,
    });
  }
}

function printRes(isResPrint, res, text = 'Response= ') {
  if (isResPrint) {
    varDump(text, res, true);
  }
}

function assertExpect(apiPort, req, res) {
  if (req.expect) {
    verifyExpectStructure(req.expect);
    apiPort.expectStatus(req.expect.status, res.status);

    if (req.expect.text) {
      apiPort.expectationOn(res.text, req.expect.text);
    }

    if (req.expect.json) {
      apiPort.expectObject(res.json, req.expect.json);
    }

    if (req.expect.headers) {
      apiPort.expectObject(res.header, req.expect.headers);
    }
  }
}

function assertExpectForError(apiPort, req, err) {
  if ((req.expect || {}).status && err.status) {
    apiPort.expectStatus(req.expect.status, err.status);
  } else if ((req.expect || {}).error && err.error) {
    apiPort.expectStatus(req.expect.error, err.error);
  } else {
    throw err;
  }
}

function saveResItem(apiPort, save, res, isResPrint) {
  for (const varName of Object.keys(save)) {
    if (typeof save[varName] === 'object') {
      const savedValue = evaluateResponseData(res, save[varName]);
      apiPort.set(varName, savedValue);
      if (isResPrint) {
        console.log(`${varName} = `, JSON.stringify(savedValue));
      }
    } else if (save[varName].startsWith('$file.')) {
      apiPort.set(varName, apiPort.resolve(save[varName]));
      if (isResPrint) {
        console.log(
          `${varName} = `,
          JSON.stringify(apiPort.resolve(save[varName])),
        );
      }
    } else {
      const value = getValueFromResponse(res, save[varName]);
      apiPort.set(varName, value, false);
      if (isResPrint) {
        console.log(`${varName} = `, JSON.stringify(value));
      }
    }
  }

  return apiPort;
}

function saveErrorResItem(apiPort, save, isResPrint) {
  for (const varName of Object.keys(save)) {
    if (
      typeof save[varName] !== 'object'
      && (save[varName].startsWith('$file.')
        || save[varName].startsWith('$config.'))
    ) {
      apiPort.set(varName, apiPort.resolve(save[varName]));
      if (isResPrint) {
        console.log(
          `${varName} = `,
          JSON.stringify(apiPort.resolve(save[varName])),
        );
      }
    }
  }

  return apiPort;
}

function init(file) {
  const fileContent = loadYamlFile(file);

  fileContent.apiCalls = fileContent.apiCalls || {};
  fileContent.apiCalls.swagger = fileContent.apiCalls.swagger || [];

  return fileContent;
}

function evaluateResponseData(res, save) {
  const keys = Object.keys(save);
  if (keys.length > 1) {
    throw new Error(`Multiple keys do not support. '${JSON.stringify(save)}'`);
  }

  const keyName = keys[0];
  if (save[keyName].startsWith('$regex')) {
    const value = getValueFromResponse(res, keyName);
    if (!value) {
      throw new Error(`Wrong key '${keyName}'`);
    }
    const parts = save[keyName].split(' ');
    if (parts.length === 2) {
      const matchedValue = value.match(parts[1]);
      if (matchedValue) {
        if (matchedValue.length === 1) {
          return matchedValue[0];
        }
        if (matchedValue.length === 2) {
          return matchedValue[1];
        }
        throw new Error(
          `Found multiple values '${matchedValue}' using regular expression '${
            parts[1]
          }'`,
        );
      }
      throw new Error(
        `Did not parse from value '${value}' using regular expression '${
          parts[1]
        }'`,
      );
    } else {
      throw new Error(
        `Wrong format: '${save[keyName]}'. Expecting like: '$regex ([a-z\\d]+)$'`,
      );
    }
  } else {
    throw new Error(
      "Did not find '$regex'. Expecting like: '$regex ([a-z\\d]+)$'",
    );
  }
}

function getValueFromResponse(res, key) {
  if (key.startsWith('json.')) {
    res.json = res.json || JSON.parse(res.text);
  }

  return objectPath.get(res, key);
}

function varDump(name, obj, printAsString = false) {
  if (printAsString) {
    console.log(name, JSON.stringify(obj, null, 2));
  } else {
    console.log(name, obj);
  }
}

function verifyExpectStructure(callExpects) {
  // a misspelling of a key could result in expectations being skipped
  // therefore, make sure that the keys in the expect object are
  // ones that are processed. Any that fall outside this list will cause
  // the test to fail
  const expectKeys = Array.from(Object.keys(callExpects));
  const unknownKeys = _.difference(expectKeys, processedExpectations);
  if (unknownKeys.length > 0) {
    throw new Error(
      `Only certain expectations are processed - unknown ones have been detected: ${_.join(
        unknownKeys,
      )}`,
    );
  }
  // now make sure the processed keys are what we exepct
  if (callExpects.json && !Array.isArray(callExpects.json)) {
    throw new Error(
      `json must be an array of expectations. Found: ${typeof callExpects.json}`,
    );
  }
}

function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}
