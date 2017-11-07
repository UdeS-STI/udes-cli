/* eslint-env mocha */
import 'babel-polyfill'
import chai, { expect } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import Lint from './../Lint'

chai.use(sinonChai)

let isPolymerProject

const htmlLint = 'htmlhint ./*/.html --config .htmlhintrc.json'
const jsLint = 'eslint . --ext js,json --ignore-path .gitignore'
const polymerLint = 'polymer lint'

const getLintInstance = (args = {}) => {
  const lint = new Lint({
    ...args,
    path: '.',
  })

  lint.shell.exec = sinon.spy()
  lint.isPolymerProject = () => isPolymerProject

  return lint
}

describe('Lint', () => {
  describe('constructor', () => {
    it('should set all argument flags to true if none are set', () => {
      Object.values((new Lint({ path: '.' })).args).forEach(arg =>
        expect(!!arg).to.be.true
      )
    })
  })

  describe('run', () => {
    beforeEach(() => {
      isPolymerProject = true
    })

    it('should lint html and js files if no fag is set and is not a polymer project.', () => {
      isPolymerProject = false
      const lint = getLintInstance()
      lint.run()

      expect(lint.shell.exec).to.be.calledWith(htmlLint)
      expect(lint.shell.exec).to.be.calledWith(jsLint)
      expect(lint.shell.exec).to.not.be.calledWith(polymerLint)
    })

    it('should lint html and js files and polymer project if no flag is set and is a polymer project', () => {
      const lint = getLintInstance()
      lint.run()

      expect(lint.shell.exec).to.be.calledWith(htmlLint)
      expect(lint.shell.exec).to.be.calledWith(jsLint)
      expect(lint.shell.exec).to.be.calledWith(polymerLint)
    })

    it('should lint html files if html flag is set', () => {
      const lint = getLintInstance({ html: true })
      lint.run()

      expect(lint.shell.exec).to.be.calledWith(htmlLint)
      expect(lint.shell.exec).to.not.be.calledWith(jsLint)
      expect(lint.shell.exec).to.not.be.calledWith(polymerLint)
    })

    it('should lint js files if js flag is set', () => {
      const lint = getLintInstance({ js: true })
      lint.run()

      expect(lint.shell.exec).to.not.be.calledWith(htmlLint)
      expect(lint.shell.exec).to.be.calledWith(jsLint)
      expect(lint.shell.exec).to.not.be.calledWith(polymerLint)
    })

    it('should lint polymer project if polymer flag is set and is polymer project', () => {
      const lint = getLintInstance({ polymer: true })
      lint.run()

      expect(lint.shell.exec).to.not.be.calledWith(htmlLint)
      expect(lint.shell.exec).to.not.be.calledWith(jsLint)
      expect(lint.shell.exec).to.be.calledWith(polymerLint)
    })
  })
})
