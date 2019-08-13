const {
  expect,
} = require('chai')
const path = require('path')
const util = require('../src/util.js')

describe('util', () => {
  describe('evaluateData', () => {
    it('Should resolve all the function values from an object to the returned value', () => {
      expect(util.evaluateData({
        some: () => 123,
        another: () => 1 + 3,
      })).to.be.deep.equal({
        some: 123,
        another: 4,
      })
    })

    it('Should resolve deep value funcions', () => {
      expect(util.evaluateData({
        someObj: {
          someObj1: {
            someObj2: () => 12389,
          },
        },
        another: () => 1 + 3,
      })).to.be.deep.equal({
        another: 4,
        someObj: {
          someObj1: {
            someObj2: 12389,
          },
        },
      })
    })
  })

  describe('loadYamlFile', () => {
    it('should thrown an error if the file is invalid', () => {
      expect(() => util.loadYamlFile('./fixtures/fixture-invalid.data.yaml')).to.throw(/Error parsing the file .\/fixtures\/fixture-invalid.data.yaml/);
    });

    it('Should resolve the files and parse yaml into to an object', () => {
      const data = util.loadYamlFile('./fixtures/fixture.data.yaml')
      expect(data).to.deep.equal({
        test: 'This is a test',
        value: 123,
      })
    })
  })

<<<<<<< HEAD
  describe('loadFile', () => {
    it('Should resolve the files and parse yaml into to an object with extention missing', () => {
      const data = util.loadFile('./fixtures/fixture.data')
      expect(data).to.deep.equal({
        test: 'This is a test',
        value: 123,
      })
    })

    it('Should resolve the files and parse yaml into to an object if the extentions is present', () => {
      const data = util.loadFile('./fixtures/fixture.data.yaml')
      expect(data).to.deep.equal({
        test: 'This is a test',
        value: 123,
      })
    })

    it('Should resolve js files', () => {
      const data = util.loadFile(path.resolve('./fixtures/fixture.javascript'))
      expect(data).to.deep.equal({
        data: 1,
      })
    })

    it('should thrown an error if the file does not exists', () => {
      expect(() => util.loadFile('./there-no-this-file')).to.throw('Could not load the file: "./there-no-this-file". One of the next files must exists: ./there-no-this-file,./there-no-this-file.js,./there-no-this-file.yaml,./there-no-this-file.yml');
    });
  });

=======
>>>>>>> ac14cc6af67da7167e8be64e647724ffe82dcd6d
  describe('FakerClass', () => {
    it('should evaluate faker API', () => {
      const faker = new util.FakerClass('name.lastName', 'global')
      expect(faker.value('global')).to.be.a('string')
    })
  })
})
