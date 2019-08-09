const _ = require('lodash')
const request = require('superagent')

module.exports = async function superClient(apiPort, req, operation, data, basicAuth) {
  const superObj = request[operation.method]
  if (!superObj) {
    throw new Error(`Invalid method: ${operation.method}`)
  }

  let { path } = operation
  if (req.parameters) {
    _.forEach(req.parameters, (value, key) => {
      path = _.replace(path, `{${key}}`, apiPort.resolve(value))
    })
  }

  let suObj = superObj(apiPort.get('API_SERVER_URL') + path)
  if (req.query) {
    suObj = suObj.query(req.query)
  } else if (basicAuth) {
    suObj = suObj.auth(basicAuth.username || '', basicAuth.password || '')
  }
  return suObj
    .set(req.header || '')
    .send(data)
    .sortQuery()
}
