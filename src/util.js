const fs = require('fs')
const YAML = require('js-yaml')
const _ = require('lodash')


function evaluateData(data) {
  const keys = Object.keys(data)
  return keys.reduce((obj, key) => {
    const value = data[key]
    const resolvedValue = _.isFunction(value) ? value() : value
    _.set(obj, key, resolvedValue)
    return obj
  }, {})
}

function loadYamlFile(filePath) {
  return evaluateData(YAML.load(fs.readFileSync(filePath, 'utf8')))
}


module.exports = {
  loadYamlFile,
  evaluateData,
}
