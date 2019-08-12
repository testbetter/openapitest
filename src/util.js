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
  const fileText = fs.readFileSync(filePath, 'utf8')
  try {
    const parsedData = YAML.load(fileText)
    const yamlDataEvaluated = evaluateData(parsedData)
    return yamlDataEvaluated
  } catch (e) {
    throw new Error(`Error parsing the file ${filePath}: ${e.message}`)
  }
}


function loadFile(filePath) {
  let fileData;
  if (fs.existsSync(`${filePath}.js`)) {
    fileData = require(`${filePath}.js`) // eslint-disable-line import/no-dynamic-require, global-require
  } else if (fs.existsSync(`${filePath}.yaml`)) {
    fileData = loadYamlFile(`${filePath}.yaml`)
  } else if (fs.existsSync(filePath)) {
    fileData = loadYamlFile(filePath)
  }
  return fileData;
}

module.exports = {
  loadYamlFile,
  evaluateData,
  loadFile,
}
