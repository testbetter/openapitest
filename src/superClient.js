/* eslint-disable comma-dangle */
const _ = require('lodash');
const request = require('superagent');
require('superagent-proxy')(request);

const proxy = process.env.PROXYURL || null;

module.exports = async function superClient(
  apiPort,
  req,
  operation,
  data,
  basicAuth
) {
  const superObj = request[operation.method];
  if (!superObj) {
    throw new Error(`Invalid method: ${operation.method}`);
  }

  let { path } = operation;
  if (req.parameters) {
    _.forEach(req.parameters, (value, key) => {
      path = _.replace(path, `{${key}}`, apiPort.resolve(value));
    });
  }

  let suObj = superObj(apiPort.get('API_SERVER_URL') + path);
  if (req.query) {
    suObj = suObj.query(req.query);
  } else if (basicAuth) {
    suObj = suObj.auth(basicAuth.username || '', basicAuth.password || '');
  }

  suObj.set(req.header || '');

  if (proxy) {
    suObj.proxy(proxy);
  }

  // Only set data if data has some value, so that content-length is zero
  if (data && data !== 'null' && Object.keys(data).length > 0) {
    suObj.send(data);
  }

  suObj.sortQuery();

  return suObj;
};
