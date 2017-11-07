/* eslint-env mocha */
import 'babel-polyfill'
// import { expect } from 'chai'

import Publish from '../Publish'

describe('Publish', () => {
  describe('constructor', () => {
    it('should set correct bash commands', () => {
      const publish = new Publish({ type: 'minor' })
      publish.run()
    })
  })
})
