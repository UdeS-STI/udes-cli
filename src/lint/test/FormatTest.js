/* eslint-env mocha */
import 'babel-polyfill'
import { expect } from 'chai'

import Format from '../Format'

describe('Format', () => {
  describe('constructor', () => {
    it('should set correct bash commands', () => {
      const lint = new Format({ path: '.' })
      expect(lint.commands.html()).to.be.equal('eslint . --ext html --ignore-path .gitignore --fix')
      expect(lint.commands.js()).to.be.equal('eslint . --ext html,js,json --ignore-path .gitignore --fix')
      expect(lint.commands.polymer).to.be.equal('polymer lint --fix')
    })
  })
})
