const { expect } = require('chai')
const util = require('../src/util.js')

describe('util', () => {
  describe('evaluateData', () => {
    it('Should should resolve all the function values from an object to the returned value', () => {
      expect(util.evaluateData({
        some: () => 123,
        another: () => 1 + 3,
      })).to.be.deep.equal({
        some: 123,
        another: 4,
      })
    })
  })
})
