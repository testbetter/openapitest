const fs = require('fs')
const YAML = require('js-yaml')
const {
  isFunction, includes, set, isObject, find, endsWith,
} = require('lodash')
const {
  isFaker,
  evaluateFaker,
  fakerScopes,
  FAKER_SCHEMA,
} = require('./customTypes/faker.js')

const isObj = value => isObject(value) && !isFunction(value)

const KEYS_TO_IGNORE = ['before', 'after']


function evaluateData(data) {
  if (isFaker(data)) {
    return evaluateFaker(data, fakerScopes.global)
  }
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
    const parsedData = YAML.load(fileText, { schema: FAKER_SCHEMA })
    const yamlDataEvaluated = evaluateData(parsedData)
    return yamlDataEvaluated
  } catch (e) {
    throw new Error(`Error parsing the file ${filePath}: ${e.message}`)
  }
}


function loadFile(fileToLoad) {
  const candidateFileNames = [fileToLoad, `${fileToLoad}.js`, `${fileToLoad}.yaml`, `${fileToLoad}.yml`];

  const filePath = find(candidateFileNames, fs.existsSync)

  if (filePath) {
    let fileData;
    if (endsWith(filePath, '.js')) {
      fileData = require(filePath) // eslint-disable-line import/no-dynamic-require, global-require
    } else {
      fileData = loadYamlFile(filePath)
    }
    return fileData;
  }
  throw Error(`Could not load the file: "${fileToLoad}".`
    + ` One of the next files must exists: ${candidateFileNames.join(',')}`)
}

module.exports = {
  loadYamlFile,
  evaluateData,
  loadFile,
}
