/* eslint-env mocha */
/* eslint no-unused-expressions: 0 */
import 'babel-polyfill'
import chai, { expect } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import Lintable from './../Lintable'

chai.use(sinonChai)

let hasEslintConfig
let hasHtmlHintConfig
let isPolymerProject

const htmlCommand = 'html command'
const jsCommand = 'js command'
const polymerCommand = 'polymer command'

const getLintableInstance = (args = {}) => {
  const lintable = new Lintable({
    html: htmlCommand,
    js: jsCommand,
    polymer: polymerCommand,
  }, { ...args, path: '.' })

  lintable.shell.exec = sinon.spy()
  lintable.hasEslintConfig = () => hasEslintConfig
  lintable.hasHtmlHintConfig = () => hasHtmlHintConfig
  lintable.isPolymerProject = () => isPolymerProject

  return lintable
}

describe('Lintable', () => {
  describe('constructor', () => {
    it('should set flag `all` to true if none flags are set', () => {
      expect(getLintableInstance().args.all).to.be.true
    })

    it('should set flag `all` if at least one flag is set', () => {
      expect(getLintableInstance({ html: true }).args.all).to.be.undefined
    })
  })

  describe('run', () => {
    beforeEach(() => {
      hasEslintConfig = true
      hasHtmlHintConfig = true
      isPolymerProject = true
    })

    it('should not throw error if no flag is set and no config file found', () => {
      hasHtmlHintConfig = false
      hasEslintConfig = false
      isPolymerProject = false
      expect(getLintableInstance().run).to.not.throw()
    })

    it('should lint html and js files and polymer project if no flag is set and all ocnfig files are found', () => {
      const lint = getLintableInstance()
      lint.run()

      expect(lint.shell.exec).to.be.calledWith(htmlCommand)
      expect(lint.shell.exec).to.be.calledWith(jsCommand)
      expect(lint.shell.exec).to.be.calledWith(polymerCommand)
    })

    it('should lint html files if html flag is set', () => {
      const lint = getLintableInstance({ html: true })
      lint.run()

      expect(lint.shell.exec).to.be.calledWith(htmlCommand)
      expect(lint.shell.exec).to.not.be.calledWith(jsCommand)
      expect(lint.shell.exec).to.not.be.calledWith(polymerCommand)
    })

    it('should throw error if html flag is set but html hint config is not found', () => {
      hasHtmlHintConfig = false
      expect(getLintableInstance({ html: true }).run).to.throw()
    })

    it('should lint js files if js flag is set', () => {
      const lint = getLintableInstance({ js: true })
      lint.run()

      expect(lint.shell.exec).to.not.be.calledWith(htmlCommand)
      expect(lint.shell.exec).to.be.calledWith(jsCommand)
      expect(lint.shell.exec).to.not.be.calledWith(polymerCommand)
    })

    it('should throw error if js flag is set but eslint config is not found', () => {
      hasEslintConfig = false
      expect(getLintableInstance({ js: true }).run).to.throw()
    })

    it('should lint polymer project if polymer flag is set and is polymer project', () => {
      const lint = getLintableInstance({ polymer: true })
      lint.run()

      expect(lint.shell.exec).to.not.be.calledWith(htmlCommand)
      expect(lint.shell.exec).to.not.be.calledWith(jsCommand)
      expect(lint.shell.exec).to.be.calledWith(polymerCommand)
    })

    it('should throw error if polymer flag is set but is not a polymer project', () => {
      isPolymerProject = false
      expect(getLintableInstance({ polymer: true }).run).to.throw()
    })
  })
})