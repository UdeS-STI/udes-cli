/* eslint-env mocha */
/* eslint no-unused-expressions: 0 */
import 'babel-polyfill'
import { expect } from 'chai'
import fs from 'fs'

import PolymerBuild from './../PolymerBuild'

const files = ['index.html', 'index.php', 'script.js']
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

describe('PolymerBuild', () => {
  before(() => {
    if (!fs.existsSync('build')) {
      fs.mkdirSync('build')
      fs.mkdirSync('build/bundled')
    }

    // TODO: Use fs.copyFileSync() after updating to node 8.
    fs.writeFileSync('htaccess.sample', fs.readFileSync(`${__dirname}/assets/htaccess.sample`))
  })

  beforeEach(() => {
    files.forEach((filename) => {
      // TODO: Use fs.copyFileSync() after updating to node 8.
      fs.writeFileSync(`build/bundled/${filename}`, fs.readFileSync(`${__dirname}/assets/${filename}`))
    })
  })

  after(() => {
    deleteFolderRecursive('build')
    fs.unlinkSync('htaccess.sample')
  })

  describe('run', () => {
    it('should throw error if argument `rootURI` is missing', () => {
      let error

      try {
        // eslint-disable-next-line no-unused-vars
        const polymerBuild = new PolymerBuild({})
      } catch (err) {
        error = err
      }

      expect(error).to.be.not.undefined
    })

    it('should create build for production', () => {
      const options = {
        baseURI: '/src/',
        build: false,
        buildNames: ['bundled'],
      }
      const polymerBuild = new PolymerBuild(options)
      polymerBuild.run()

      const indexHtml = fs.readFileSync('build/bundled/index.html').toString()

      expect(indexHtml).to.be.equal('<!DOCTYPE html><html><head><base href="/src/" /><script>let hello="world";hello=hello.replace("world","foo");</script></head><body></body></html>\n')
      expect(fs.existsSync('build/bundled/index.php')).to.be.false
      expect(fs.existsSync('build/bundled/script.js')).to.be.false
      expect(fs.existsSync('build/bundled/.htaccess')).to.be.false
    })

    it('should create build for dev', () => {
      const options = {
        addBuildDir: true,
        baseURI: '/src/',
        build: false,
        buildNames: ['bundled'],
        copyHtaccessSample: true,
      }
      const polymerBuild = new PolymerBuild(options)
      polymerBuild.run()

      const indexHtml = fs.readFileSync('build/bundled/index.html').toString()
      const indexPhp = fs.readFileSync('build/bundled/index.php').toString()
      const htaccess = fs.readFileSync('build/bundled/.htaccess').toString()

      expect(indexHtml).to.be.equal('<!DOCTYPE html><html><head><base href="/src/build/bundled/" /><script>let hello="world";hello=hello.replace("world","foo");</script></head><body></body></html>\n')
      expect(indexPhp).to.be.equal('<?php echo "This is a PHP file"; ?>\n')
      expect(htaccess).to.be.equal('RewriteBase /src/build/bundled/\n')
      expect(fs.existsSync('build/bundled/script.js')).to.be.false
    })
  })
})
