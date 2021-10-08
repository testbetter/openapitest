const faker = require('faker')
const {
  isFunction, includes, mapValues, partialRight, isArray, ary, isObject,
} = require('lodash')
const YAML = require('js-yaml')

const GLOBAL = 'global'
const FILE = 'file'
const TEST = 'test'

const SCOPE_HIERARCHY = {
  [GLOBAL]: [GLOBAL],
  [FILE]: [FILE, GLOBAL],
  [TEST]: [TEST, FILE, GLOBAL],
};

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

function resolve(data) {
  return data !== null && data.length > 0
}

function fakerConstruct(data, scope = GLOBAL) {
  const isDataArray = isArray(data)
  const fakerApi = isDataArray ? data[0] : data
  const fakerScope = isDataArray ? data[1] : scope
  return new FakerClass(fakerApi, fakerScope)
}

function represent(obj) {
  return [obj.fakerInstruction, obj.scope];
}

const FakerClassType = new YAML.Type('!faker', {
  kind: 'sequence',
  resolve,
  construct: fakerConstruct,
  instanceOf: FakerClass,
  represent,
});

const FakerClassTypeScalar = new YAML.Type('!faker', {
  kind: 'scalar',
  resolve,
  construct: fakerConstruct,
  instanceOf: FakerClass,
  represent,
});

const FAKER_SCHEMA = YAML.Schema.create([FakerClassType, FakerClassTypeScalar])

function isFaker(data) {
  return (data instanceof FakerClass) && data.value && isFunction(data.value)
}

function evaluateFaker(data, scope) {
  if (isFunction(data)) {
    return data
  }

  if (isFaker(data)) {
    const resulvedValue = data.value(scope)
    return resulvedValue
  }

  if (isArray(data)) {
    return data.map(ary(partialRight(evaluateFaker, scope), 1))
  }

  if (isObject(data)) {
    return mapValues(data, value => { (isObject(value) ? evaluateFaker(value, scope) : value) })
  }
  return data
}

module.exports = {
  isFaker,
  FakerClass,
  evaluateFaker,
  fakerScopes: {
    global: GLOBAL,
    file: FILE,
    test: TEST,
  },
  FAKER_SCHEMA,
}
