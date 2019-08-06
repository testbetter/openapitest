const _ = require('lodash')
const objectPath = require('object-path')
const expect = require('expect.js')
const fs = require('fs')
const YAML = require('js-yaml')
const path = require('path')

const currentDir = process.cwd()


function getLocalDir(dir, required = true) {
  const localDir = path.join(currentDir, dir)
  if (!fs.existsSync(localDir)) {
    if (required) {
      throw new Error(`local directory ${dir} is required for integration testing.`)
    }
    return undefined
  }
  return localDir
}

function loadFile(filePath) {
  if (fs.existsSync(`${filePath}.js`)) {
    return require(`${filePath}.js`)
  } if (fs.existsSync(`${filePath}.yaml`)) {
    return YAML.load(fs.readFileSync(`${filePath}.yaml`), 'uft8')
  }
}

function parseOpValue(expectationValue) {
  if (typeof expectationValue !== 'string' || !expectationValue.startsWith('to.')) {
    return {
      op: 'to.be.equal',
      value: expectationValue,
    }
  }

  // split the string on spaces
  const parts = expectationValue.split(' ')
  const ret = {
    op: parts[0],
  }

  if (parts.length > 1) {
    ret.value = expectationValue.substring(ret.op.length).trim()
  }

  return ret
}

class ApiPort {
  constructor() {
    this.apiPort = {}
    this.currentFile = ''
  }

  init() {
    this.set('TIMEOUT', process.env.TIMEOUT || 60000)

    this.set('API_SERVER_URL', process.env.API_SERVER_URL)

    this.set('API_TESTS_PATH', process.env.API_TESTS_PATH || getLocalDir('integration/test-spec'))

    let openApiPath = ''
    if (process.env.OPENAPI_PATH) {
      openApiPath = this.getAbsolutePath(process.env.OPENAPI_PATH)
    }
    this.set('OPENAPI_PATH', openApiPath || getLocalDir('integration/api-docs.json'))

    let testDataPath = ''
    if (process.env.TEST_DATA_PATH) {
      testDataPath = this.getAbsolutePath(process.env.TEST_DATA_PATH)
    }
    this.set('TEST_DATA_PATH', testDataPath || getLocalDir('integration/data', false), false)

    let sharedDataPath = ''
    if (process.env.SHARED_TEST_DATA) {
      sharedDataPath = this.getAbsolutePath(process.env.SHARED_TEST_DATA)
    }
    this.set('SHARED_TEST_DATA', sharedDataPath, false)

    const apis = require(this.get('OPENAPI_PATH'))

    const operations = {}

    apis.servers[0] = { url: this.get('API_SERVER_URL') }

    for (const path of Object.keys(apis.paths)) {
      const params = apis.paths[path].parameters || []
      for (const action of Object.keys(apis.paths[path])) {
        const actionObj = apis.paths[path][action]
        const { operationId } = actionObj
        if (operationId) {
          const operation = apis.paths[path][action]
          operation.path = path
          operation.method = action
          operation.parameters = _.unionBy(
            actionObj.parameters,
            params,
            'name',
          )
          operations[actionObj.operationId] = operation
        }
      }
    }

    this.set('OPENAPI_SPEC', apis)
    this.set('OPENAPI_OPERATIONS', operations)
  }

  getAbsolutePath(envPath) {
    const cd = process.env.CD
    return path.isAbsolute(envPath) ? envPath : path.join(cd, envPath)
  }

  reset() {
    for (const key in this.apiPort) {
      if (key.match(/^[^A-Z]/)) {
        delete this.apiPort[key]
      }
    }
  }

  start() {
    this.keys = []
  }

  remove() {
    this.keys.forEach(key => delete this.apiPort[key])
  }

  set(key, value, required = true) {
    if (required && value === undefined) {
      throw new Error(`Value required for: ${key}`)
    }
    this.apiPort[key] = value
    return this
  }

  get(key, defaultValue = null) {
    return typeof this.apiPort[key] === 'undefined' ? defaultValue : this.apiPort[key]
  }

  exists(value) {
    const c = `${value}`
    const matches = c.match(/\${[^}]+}/g)
    let exists = true

    if (matches) {
      matches.forEach((match) => {
        const repl = objectPath.get(this.apiPort, match.substring(2, match.length - 1))

        if (typeof repl === 'undefined') {
          exists = false
          return false
        }

        return null
      })
    }

    return exists
  }

  resolve(value) {
    let valueStr = `${value}`
    if (valueStr.startsWith('$file.')) {
      return this.getDataFromFile(valueStr.substring('$file.'.length))
    }

    const matches = valueStr.match(/\${[^.][^}]+}/g)

    if (!matches) {
      return value
    }

    for (const match of matches) {
      const tokenVar = match.substring(2, match.length - 1)
      const replaceStr = objectPath.get(this.apiPort, tokenVar)
      if (!replaceStr) {
        throw new Error(`${tokenVar} not found.`)
      }
      if (typeof replaceStr === 'object') {
        if (valueStr !== match) {
          throw new Error(`Cannot set object in string: ${value}`)
        }
        return replaceStr
      }
      if (valueStr === match && (typeof repl === 'number' || typeof replaceStr === 'boolean')) {
        return replaceStr
      }
      valueStr = valueStr.replace(match, replaceStr)
    }

    return valueStr
  }

  resolveObject(obj = {}) {
    for (const key of Object.keys(obj)) {
      obj[key] = this.resolve(obj[key])
    }

    return obj
  }

  getDataFromFile(fileAndKeyName, file = '') {
    this.apiPort.$file = this.apiPort.$file || {}

    const filePath = path.parse(file).dir
    const parts = fileAndKeyName.split('.')
    const fileName = parts[0]
    const objPath = _.join(parts.slice(1), '.')

    if (!this.apiPort.$file[fileName]) {
      const lookIn = [this.get('TEST_DATA_PATH'), filePath, this.get('SHARED_TEST_DATA')]

      for (const testDataPath of lookIn) {
        if (testDataPath) {
          const filePath = `${testDataPath}/${fileName}.data`
          const fileData = loadFile(filePath)
          if (fileData) {
            this.apiPort.$file[fileName] = fileData
            break
          }
        }
      }

      if (!this.apiPort.$file[fileName]) {
        throw new Error(`Cannot find test data file: ${fileName}.data.(js|yaml) in any of: ${lookIn}`)
      }
    }

    return objPath.length > 0
      ? objectPath.get(this.apiPort.$file[fileName], objPath)
      : this.apiPort.$file[fileName]
  }

  validateParams(allParams, reqParams) {
    for (const key of Object.keys(reqParams)) {
      if (_.findIndex(allParams, { name: key, in: 'path' }) === -1) {
        throw new Error(`Parameter '${key}' does not exist`)
      } else {
        allParams = _.differenceBy(allParams, [{ name: key, in: 'path' }], 'name')
      }
    }

    const foundIndex = _.findIndex(allParams, { in: 'path', required: true })
    if (allParams && foundIndex !== -1) {
      throw new Error(`Parameter '${allParams.foundIndex.name}' is required`)
    }
  }

  expectStatus(expectedStatus, actualStatus) {
    if (expectedStatus) {
      if (Array.isArray(expectedStatus)) {
        expect(this.resolve(expectedStatus)).to.contain(actualStatus)
      } else {
        expect(actualStatus).to.be.equal(this.resolve(expectedStatus))
      }
    }
  }

  expectationOn(responseObject, expectation) {
    const keys = Array.from(Object.keys(expectation))
    if (keys.length !== 1) {
      throw new Error(`Expectation can only have one key. Found: ${keys}`)
    }

    const objPath = keys[0]
    const { op, value } = parseOpValue(expectation[keys[0]])

    const actualVal = objectPath.get(responseObject, objPath)
    const resolvedValue = this.resolve(value)

    // TODO this would be nicer than eval, but not sure it can work
    // const op = objectPath(expect(actualVal), rest[remainingKeys[0]])
    // expect(op).to.be.a('function')
    // op(value)
    eval(`expect(actualVal).${op}(resolvedValue)`)
  }
}



module.exports = ApiPort
