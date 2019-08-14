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


const FAKER_SCHEMA = YAML.Schema.create([FakerClassType])

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

  if (isObject(data)) {
    return mapValues(data, value => (isObject(value) ? evaluateFaker(value, scope) : value))
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
