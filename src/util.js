const fs = require('fs')
const YAML = require('js-yaml')
const faker = require('faker')
const {
  isFunction, includes, set, isObject, mapValues, partialRight, isArray, ary
} = require('lodash')

const GLOBAL = 'global'
const FILE = 'file'
const TEST = 'test'

const isObj = value => isObject(value) && !isFunction(value)

const KEYS_TO_IGNORE = ['before', 'after']


function FakerClass(fakerInstruction, scope = GLOBAL) {
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

function isFaker(data) {
  return (data instanceof FakerClass) && data.value && isFunction(data.value)
}

function evaluateFaker(data, scope) {
  if (isFaker(data)) {
    const resulvedValue = data.value(scope)
    return resulvedValue
  }

  if (isArray(data)) {
    return data.map(ary(partialRight(evaluateFaker, scope), 1))
  }

  if (isObj(data)) {
    return mapValues(data, value => (isObj(value) ? evaluateFaker(value, scope) : value))
  }
  return data
}

function evaluateData(data) {
  if (isFaker(data)) {
    return evaluateFaker(data, GLOBAL)
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


module.exports = {
  loadYamlFile,
  evaluateData,
  FakerClass,
  evaluateFaker,
  fakerScopes: {
    global: GLOBAL,
    file: FILE,
    test: TEST,
  },
}
