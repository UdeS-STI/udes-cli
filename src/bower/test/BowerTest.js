/* eslint-env mocha */
import 'babel-polyfill'
import chai, { expect } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import Bower from '../Bower'

chai.use(sinonChai)

const getBowerInstance = (args = {}) => {
  const bower = new Bower(args)
  bower.shell.exec = sinon.spy()
  return bower
}

describe('Bower', () => {
  describe('run', () => {
    it('should execute `bower install` when using `install` command', () => {
      const bower = getBowerInstance({ command: 'install' })
      bower.run()

      expect(bower.shell.exec).to.be.calledWith('bower install')
    })

    it('should execute install new package when using `install` command with a package name', () => {
      const bower = getBowerInstance({ command: 'install', package: ['UdeSElements/udes-moment'], options: ['--save'] })
      bower.run()

      expect(bower.shell.exec).to.be.calledWith('bower-locker unlock')
      expect(bower.shell.exec).to.be.calledWith('bower install UdeSElements/udes-moment --save')
      expect(bower.shell.exec).to.be.calledWith('bower-locker lock')
    })

    it('should execute install new packages when using `install` command with multiple package names', () => {
      const bower = getBowerInstance({ command: 'install', package: ['UdeSElements/udes-moment', 'UdeSElements/udes-language-mixin'], options: ['--save'] })
      bower.run()

      expect(bower.shell.exec).to.be.calledWith('bower-locker unlock')
      expect(bower.shell.exec).to.be.calledWith('bower install UdeSElements/udes-moment UdeSElements/udes-language-mixin --save')
      expect(bower.shell.exec).to.be.calledWith('bower-locker lock')
    })

    it('should execute `bower-locker lock` when using `lock` command', () => {
      const bower = getBowerInstance({ command: 'lock' })
      bower.run()

      expect(bower.shell.exec).to.be.calledWith('bower-locker lock')
    })

    it('should execute `bower-locker status` when using `status` command', () => {
      const bower = getBowerInstance({ command: 'status' })
      bower.run()

      expect(bower.shell.exec).to.be.calledWith('bower-locker status')
    })

    it('should execute `bower-locker unlock` when using `unlock` command', () => {
      const bower = getBowerInstance({ command: 'unlock' })
      bower.run()

      expect(bower.shell.exec).to.be.calledWith('bower-locker unlock')
    })

    it('should execute `bower-locker validate` when using `validate` command', () => {
      const bower = getBowerInstance({ command: 'validate' })
      bower.run()

      expect(bower.shell.exec).to.be.calledWith('bower-locker validate')
    })
  })
})
