/* eslint-env mocha */
import 'babel-polyfill'
import chai, { expect } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import Format from '../Format'

chai.use(sinonChai)

let isPolymerProject

const htmlformat = 'eslint . --ext html --ignore-path .gitignore --fix'
const jsformat = 'eslint . --ext js,json --ignore-path .gitignore --fix'
const polymerformat = 'polymer lint --fix'

const getFormatInstance = (args = {}) => {
  const format = new Format(args)

  format.shell.exec = sinon.spy()
  format.isPolymerProject = () => isPolymerProject

  return format
}

describe('Format', () => {
  describe('constructor', () => {
    it('should set all argument flags to true if none are set', () => {
      Object.values((new Format({})).args).forEach(arg =>
        expect(!!arg).to.be.true
      )
    })
  })

  describe('run', () => {
    beforeEach(() => {
      isPolymerProject = true
    })

    it('should format html and js files if no fag is set and is not a polymer project.', () => {
      isPolymerProject = false
      const format = getFormatInstance()
      format.run()

      expect(format.shell.exec).to.be.calledWith(htmlformat)
      expect(format.shell.exec).to.be.calledWith(jsformat)
      expect(format.shell.exec).to.not.be.calledWith(polymerformat)
    })

    it('should format html and js files and polymer project if no flag is set and is a polymer project', () => {
      const format = getFormatInstance()
      format.run()

      expect(format.shell.exec).to.be.calledWith(htmlformat)
      expect(format.shell.exec).to.be.calledWith(jsformat)
      expect(format.shell.exec).to.be.calledWith(polymerformat)
    })

    it('should format html files if html flag is set', () => {
      const format = getFormatInstance({ html: true })
      format.run()

      expect(format.shell.exec).to.be.calledWith(htmlformat)
      expect(format.shell.exec).to.not.be.calledWith(jsformat)
      expect(format.shell.exec).to.not.be.calledWith(polymerformat)
    })

    it('should format js files if js flag is set', () => {
      const format = getFormatInstance({ js: true })
      format.run()

      expect(format.shell.exec).to.not.be.calledWith(htmlformat)
      expect(format.shell.exec).to.be.calledWith(jsformat)
      expect(format.shell.exec).to.not.be.calledWith(polymerformat)
    })

    it('should format polymer project if polymer flag is set and is polymer project', () => {
      const format = getFormatInstance({ polymer: true })
      format.run()

      expect(format.shell.exec).to.not.be.calledWith(htmlformat)
      expect(format.shell.exec).to.not.be.calledWith(jsformat)
      expect(format.shell.exec).to.be.calledWith(polymerformat)
    })
  })
})
