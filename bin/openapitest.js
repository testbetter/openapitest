#! /usr/bin/env node

const fs = require('fs')
const program = require('commander')
const Mocha = require('mocha')
const path = require('path')
const colors = require('colors')

program
    .version('0.1.0')
    .option('-o, --openapi [path]', 'Open API relative/ absolute path. e.g: <path>/openapi.json')
    .option(
        '-t, --testDir [path]',
        'Test folder relative/ absolute path.  e.g: <path>/integration/test-spec'
    )
    .option(
        '-d, --dataDir [path]',
        'Test data folder. Defaults to a folder called "data" that is a sibling to the testDir'
    )
    .option(
        '-s, --sharedir [path]',
        'Common Test data folder relative/ absolute path.  e.g: <path>/integration/test-spec'
    )
    .option(
        '-c, --dataConfig [path]',
        'Global Test data config folder relative/ absolute path.  e.g: <path>/global-config'
    )
    .option(
        '-r, --report <n>',
        'Will generate the html report or not.  e.g: 1 or 0',
        parseInt
    )
    .option('-u, --url [url]', 'Server URL. e.g: http://localhost:9000')

program.parse(process.argv)

let cd = process.cwd()
process.env.CD = cd

checkRequired(program, 'openapi')
checkExists(program.openapi, 'Openapi file')
checkRequired(program, 'testDir')
checkExists(program.testDir, 'Test directory')
checkRequired(program, 'url')

process.env.OPENAPI_PATH = program.openapi
process.env.API_TESTS_PATH = program.testDir
process.env.GLOBAL_DATA_CONFIG = program.dataConfig

if (program.dataDir) {
    checkExists(program.dataDir, 'Data directory')
    process.env.TEST_DATA_PATH = program.dataDir
} else {
    process.env.TEST_DATA_PATH = program.testDir
}

if (program.sharedir) {
    checkExists(program.sharedir, 'Common test data directory')
    process.env.SHARED_TEST_DATA = program.sharedir
}

process.env.API_SERVER_URL = program.url

let options = {}
if(program.report) {
    options.reporter = 'mochawesome'
    options.reporterOptions = {
        reportDir: 'reports',
        reportFilename: 'test-int-report',
        overwrite: true,
        charts: true,
        code: false,
        quiet: true
    }
}

const mocha = new Mocha(options)

mocha.addFile(path.join(__dirname, '../src/mocha'))
mocha.run(function(failures) {
    process.exitCode = failures
})

function checkRequired(prog, option) {
    if (!prog[option]) {
        console.log(`Required option "${option}" missing`.bold.red)
        process.exit(-1)
    }
}

function checkExists(file, desc) {
    if (!fs.existsSync(file)) {
        console.log(`${desc}: ${file} does not exist.`.bold.red)
        process.exit(-1)
    }
}