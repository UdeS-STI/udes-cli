/* eslint-env mocha */
import 'babel-polyfill'
import { expect } from 'chai'

import Lint from './../Lint'

describe('Lint', () => {
  describe('constructor', () => {
    it('should set correct bash commands', () => {
      const lint = new Lint({ path: '.' })
      expect(lint.commands.html()).to.be.equal('htmlhint ./*/.html --config .htmlhintrc.json')
      expect(lint.commands.js()).to.be.equal('eslint . --ext html,js,json --ignore-path .gitignore')
      expect(lint.commands.polymer).to.be.equal('polymer-cli lint')
    })
  })
})
