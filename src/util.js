const fs = require('fs')
const YAML = require('js-yaml')
const faker = require('faker')
const {
  isFunction, includes, set, isObject, find, endsWith, mapValues, partialRight, isArray, ary,
} = require('lodash')

const GLOBAL = 'global'
const FILE = 'file'
const TEST = 'test'

const SCOPE_HIERARCHY = {
  [GLOBAL]: [GLOBAL],
  [FILE]: [FILE, GLOBAL],
  [TEST]: [TEST, FILE, GLOBAL],
};

const isObj = value => isObject(value) && !isFunction(value)

const KEYS_TO_IGNORE = ['before', 'after']

function getScopesToEvaluate(scope) {
  const scopesToEvaluate = SCOPE_HIERARCHY[scope]
  if (!scopesToEvaluate) {
    throw new Error(`Error: ${scope} is not a valid Faker scope. Try one of ${Object.keys(SCOPE_HIERARCHY).join(',')}`)
  }
  return scopesToEvaluate
}

const validateScope = getScopesToEvaluate // Sugar function to be used in FakerClass constructor

function FakerClass(fakerInstruction, scope = GLOBAL) {
  this.fakerInstruction = fakerInstruction
  this.scope = scope
  validateScope(scope)
}

FakerClass.prototype.value = function value(scope = GLOBAL) {
  const scopesToEvaluate = getScopesToEvaluate(scope)
  return includes(scopesToEvaluate, this.scope) ? faker.fake(`{{${this.fakerInstruction}}}`) : this
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
  evaluateFaker,
  fakerScopes: {
    global: GLOBAL,
    file: FILE,
    test: TEST,
  },
}
