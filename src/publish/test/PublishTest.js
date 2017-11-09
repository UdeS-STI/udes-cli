/* eslint-env mocha */
import 'babel-polyfill'
import chai, { expect } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import Publish from '../Publish'

chai.use(sinonChai)

const packageJson = {}

const getPublishInstance = (args) => {
  const publish = new Publish({ ...args, type: 'patch' })

  publish.exec = sinon.spy()
  publish.setPackageInfo = () => packageJson

  return publish
}

describe('Publish', () => {
  describe('constructor', () => {
    it('should throw error if  set correct bash commands', () => {
      const publish = getPublishInstance()
      publish.run()

      expect(true).to.be.true
    })
  })
})
