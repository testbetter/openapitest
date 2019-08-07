const fs = require('fs')
const YAML = require('js-yaml')
const _ = require('lodash')


function evaluateData(data) {
  const keys = Object.keys(data)
  return keys.reduce((obj, key) => {
    const value = data[key]
    const resolvedValue = _.isFunction(value) ? value() : value
    const setValue = _.isObject(resolvedValue) ? evaluateData(resolvedValue) : resolvedValue;
    _.set(obj, key, setValue)
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
