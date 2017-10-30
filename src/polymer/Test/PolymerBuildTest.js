/* eslint-env mocha */
/* eslint no-unused-expressions: 0 */
import 'babel-polyfill'
import { expect } from 'chai'
import fs from 'fs'

import PolymerBuild from './../PolymerBuild'

const file = fs.readFileSync(`${__dirname}/assets/_index.html`).toString()
console.log(file)

const deleteFolderRecursive = (path) => {
  fs.readdirSync(path).forEach((file) => {
    const currentPath = `${path}/${file}`
    if (fs.lstatSync(currentPath).isDirectory()) {
      deleteFolderRecursive(currentPath)
    } else {
      fs.unlinkSync(currentPath)
    }
  })

  fs.rmdirSync(path)
}

const files = ['_index.html', 'index.php', 'script.js']

describe('PolymerBuild', () => {
  before(() => {
    fs.mkdirSync('build')
    fs.mkdirSync('build/bundled')
  })

  beforeEach(() => {
    files.forEach((filename) => {
      // TODO: Use fs.copyFileSync() after updating to node 8.
      fs.writeFileSync(`build/bundled/${filename}`, fs.readFileSync(`${__dirname}/assets/${filename}`))
    })
  })

  after(() => {
    deleteFolderRecursive('build')
  })

  describe('run', () => {
    it('should ...', () => {
      const polymerBuild = new PolymerBuild({ rootURI: '/', buildName: ['bundled'], build: false })
      polymerBuild.run()

      expect(polymerBuild).to.be.not.null
    })
  })
})
