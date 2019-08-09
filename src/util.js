const fs = require('fs')
const YAML = require('js-yaml')
const faker = require('faker')
const {
  isFunction, includes, set, isObject, find, endsWith, mapValues,
} = require('lodash')

const isObj = value => isObject(value) && !isFunction(value)

const KEYS_TO_IGNORE = ['before', 'after']


function FakerClass(fakerInstruction, scope = 'global') {
  this.fakerInstruction = fakerInstruction
  this.scope = scope
}

const FakerClassType = new YAML.Type('!faker', {
  kind: 'sequence',
  resolve(data) {
    return data !== null && data.length > 0
  },

  construct(data) {
    return new FakerClass(data[0], data[1])
  },

  instanceOf: FakerClass,

  represent(obj) {
    return [obj.fakerInstruction, obj.scope];
  },
});

FakerClass.prototype.value = function value(scope) {
  return scope === this.scope ? faker.fake(`{{${this.fakerInstruction}}}`) : this
}

const CUSTUM_SCHEMA = YAML.Schema.create([FakerClassType])

function evaluateFaker(data, scope) {
  if (data.value && isFunction(data.value)) {
    const resulvedValue = data.value(scope)
    return resulvedValue
  }
  return mapValues(data, value => (isObj(value) ? evaluateFaker(value) : value))
}

function evaluateData(data) {
  if (data.value && isFunction(data.value)) {
    return evaluateFaker(data, 'global')
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
    const parsedData = YAML.load(fileText, { schema: CUSTUM_SCHEMA })
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
  FakerClass,
}
