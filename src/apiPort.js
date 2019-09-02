const _ = require('lodash')
const objectPath = require('object-path')
const expect = require('expect.js')
const fs = require('fs')
const path = require('path')
const klawSync = require('klaw-sync')
const { loadFile, YamlParsingError } = require('./util.js')

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

function getAbsolutePath(envPath) {
  const cd = process.env.CD
  return path.isAbsolute(envPath) ? envPath : path.join(cd, envPath)
}

class ApiPort {
  constructor() {
    this.apiPort = {}
    this.currentFile = ''
    this.globalDataConfig = []
  }

  init() {
    this.set('TIMEOUT', process.env.TIMEOUT || 60000)

    this.set('API_SERVER_URL', process.env.API_SERVER_URL)

    this.set('API_TESTS_PATH', process.env.API_TESTS_PATH || getLocalDir('integration/test-spec'))
    this.set('GLOBAL_DATA_CONFIG', process.env.GLOBAL_DATA_CONFIG, false)

    if (process.env.GLOBAL_DATA_CONFIG) {
      const globalDataConfigFolderPath = getAbsolutePath(process.env.GLOBAL_DATA_CONFIG)
      const globalDataConfigFolderPaths = klawSync(globalDataConfigFolderPath, { nodir: true })
      globalDataConfigFolderPaths.forEach((file) => {
        const filePath = file.path
        let fileName = path.basename(filePath, path.extname(filePath));
        fileName = fileName.replace('.config', '')
        const fileData = loadFile(filePath, true)
        if (fileData) {
          this.globalDataConfig[fileName] = fileData
        }
      })
    }

    let openApiPath = ''
    if (process.env.OPENAPI_PATH) {
      openApiPath = getAbsolutePath(process.env.OPENAPI_PATH)
    }
    this.set('OPENAPI_PATH', openApiPath || getLocalDir('integration/api-docs.json'))

    let testDataPath = ''
    if (process.env.TEST_DATA_PATH) {
      testDataPath = getAbsolutePath(process.env.TEST_DATA_PATH)
    }
    this.set('TEST_DATA_PATH', testDataPath || getLocalDir('integration/data', false), false)

    let sharedDataPath = ''
    if (process.env.SHARED_TEST_DATA) {
      sharedDataPath = getAbsolutePath(process.env.SHARED_TEST_DATA)
    }
    this.set('SHARED_TEST_DATA', sharedDataPath, false)

    const apis = require(this.get('OPENAPI_PATH')) // eslint-disable-line import/no-dynamic-require, global-require

    const operations = {}

    apis.servers[0] = { url: this.get('API_SERVER_URL') }

    for (const apiPath of Object.keys(apis.paths)) {
      const params = apis.paths[apiPath].parameters || []
      for (const action of Object.keys(apis.paths[apiPath])) {
        const actionObj = apis.paths[apiPath][action]
        const { operationId } = actionObj
        if (operationId) {
          const operation = apis.paths[apiPath][action]
          operation.path = apiPath
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
    if (valueStr.startsWith('$config.')) {
      const fileAndKeyName = valueStr.substring('$config.'.length)
      const parts = fileAndKeyName.split('.')
      const fileName = parts.length > 0 ? parts[0] : ''
      const keyName = parts.length > 0 ? parts[1] : ''
      return fileName && keyName ? this.globalDataConfig[fileName][keyName] : ''
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
      if (valueStr === match && (typeof replaceStr === 'number' || typeof replaceStr === 'boolean')) {
        return replaceStr
      }
      valueStr = valueStr.replace(match, replaceStr)
    }

    return valueStr
  }

  resolveObject(obj = {}) {
    return Object.keys(obj).reduce((actual, key) => {
      const value = obj[key];
      const resolvedValue = _.isObject(value) ? this.resolveObject(value) : this.resolve(value)
      _.set(actual, key, resolvedValue)
      return actual;
    }, obj)
  }

  getDataFromFile(fileAndKeyName, file = '') {
    this.apiPort.$file = this.apiPort.$file || {}

    const fileDir = path.parse(file).dir
    const parts = fileAndKeyName.split('.')
    const fileName = parts[0]
    const objPath = _.join(parts.slice(1), '.')
    const fileDataDir = path.join(fileDir, 'data')

    if (!this.apiPort.$file[fileName]) {
      const lookIn = [this.get('TEST_DATA_PATH'), fileDir, fileDataDir, this.get('SHARED_TEST_DATA')]

      for (const testDataPath of lookIn) {
        if (testDataPath) {
          const filePath = `${testDataPath}/${fileName}.data`
          try {
            const fileData = loadFile(filePath)
            if (fileData) {
              this.apiPort.$file[fileName] = fileData
              break
            }
          } catch (e) {
            delete this.apiPort.$file[fileName]
            // Ignored here if not found will re-throw the error in the end of this loop
            if (e instanceof YamlParsingError) {
              throw e
            }
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
        allParams = _.differenceBy(allParams, [{ name: key, in: 'path' }], 'name') // eslint-disable-line
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

    const actualVal = objectPath.get(responseObject, objPath) // eslint-disable-line no-unused-vars
    const resolvedValue = this.resolve(value) // eslint-disable-line no-unused-vars

    // TODO this would be nicer than eval, but not sure it can work
    // const op = objectPath(expect(actualVal), rest[remainingKeys[0]])
    // expect(op).to.be.a('function')
    // op(value)
    eval(`expect(actualVal).${op}(resolvedValue)`) // eslint-disable-line no-eval
  }
}

module.exports = ApiPort
