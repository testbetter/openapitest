const fs = require('fs')
const YAML = require('js-yaml')
const {
  isFunction, includes, set, isObject,
} = require('lodash')

const isObj = value => isObject(value) && !isFunction(value)

const KEYS_TO_IGNORE = ['before', 'after']


function evaluateData(data) {
  const keys = Object.keys(data)
  return keys.reduce((obj, key) => {
    const value = data[key]
    const newValue = isFunction(value) && !includes(KEYS_TO_IGNORE, key) ? value() : value
    const setValue = isObj(newValue) ? evaluateData(newValue) : newValue;
    set(obj, key, setValue)
    return obj
  }, data)
}

function loadYamlFile(filePath) {
  return evaluateData(YAML.load(fs.readFileSync(filePath, 'utf8')))
}


module.exports = {
  loadYamlFile,
  evaluateData,
}
