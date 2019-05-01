const _ = require('lodash')
const request = require('superagent')

module.exports = async function (state, req, operation, data, basicAuth) {
  const superObj = request[operation.method]
  if (!superObj) {
    throw new Error(`Invalid method: ${operation.method}`)
  }

  let path = operation.path
  if (req.parameters) {
    _.forEach(req.parameters, function (value, key) {
      path = _.replace(path, `{${key}}`, state.resolve(value))
    })
  }

  let suObj = superObj(state.get('API_SERVER_URL') + path)
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
