const {
  expect,
} = require('chai')
const { FakerClass, fakerScopes } = require('../src/customTypes/faker')

describe('FakerClass', () => {
  it('should evaluate faker API', () => {
    const faker = new FakerClass('name.lastName', 'global')
    expect(faker.value('global')).to.be.a('string')
    expect(faker.value('global')).to.not.contains('!faker')
  })

  it('should evaluate not evaluate global scope if the FakerClass has a file scope', () => {
    const faker = new FakerClass('name.lastName', fakerScopes.file)

    expect(faker.value('global')).not.to.be.a('string')

    expect(faker.value('file')).to.be.a('string')
    expect(faker.value('file')).not.to.have.string('!faker')

    expect(faker.value('test')).to.be.a('string')
    expect(faker.value('test')).not.to.have.string('!faker')
  })

  it('should evaluate not evaluate global or file scope if the FakerClass has a test scope', () => {
    const faker = new FakerClass('name.lastName', fakerScopes.test)

    expect(faker.value('global')).not.to.be.a('string')

    expect(faker.value('file')).not.to.be.a('string')

    expect(faker.value('test')).to.be.a('string')
    expect(faker.value('test')).not.to.have.string('!faker')
  })

  it('should thrown an error if the scope is not valid', () => {
    const faker = new FakerClass('name.lastName', fakerScopes.test)

    expect(() => faker.value('jose')).to.throw('Error: jose is not a valid Faker scope. Try one of global,file,test')
  })

  it('should thrown an error if the scope is not valid in the constructor', () => {
    expect(() => new FakerClass('name.lastName', 'mary')).to.throw('Error: mary is not a valid Faker scope. Try one of global,file,test')
  })
})
