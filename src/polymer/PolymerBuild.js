import fs from 'fs'
import shell from 'shelljs'
import UglifyJS from 'uglify-es'
import yargs from 'yargs'

import { logger } from '../lib/logger'

/**
 * Get build names from polymer config file.
 * @private
 * @returns {[String]} List of build names.
 */
const getDefaultBuildNames = () =>
  JSON.parse(fs.readFileSync('polymer.json')).builds.map(({ name, preset }) => name || preset)

/**
 * Converts command line arguments into a usable object.
 * @private
 * @param {[String]} args - Arguments passed through command line.
 * @returns {Object} Arguments in a formatted object.
 */
const formatArguments = (args) => {
  const dir = 'build/'
  const {
    addBuildDir = false,
    addBuildName = false,
    baseURI,
    build = true,
    buildNames = getDefaultBuildNames(),
    copyHtaccessSample = false,
  } = args

  if (copyHtaccessSample) {
    logger.debug('.htaccess Rewrite without build directory: true')
  }

  return {
    addBuildDir,
    addBuildName,
    baseURI,
    build,
    buildNames: (Array.isArray(buildNames)) ? buildNames : [buildNames],
    copyHtaccessSample,
    dir,
  }
}

/**
 * Class to handle actions related to building a polymer project.
 * @class
 * @params {Object} [args] - Build arguments when not using command line.
 * @params {Boolean} [args.addBuildDir=false] - Append buildDir to base href and Rewritebase if true.
 * @params {String} args.baseURI - HTML base URI for href values.
 * @params {Boolean} [args.build=true] - Execute `polymer build` command before executing script if true.
 * @params {[String]} [args.buildNames=getDefaultBuildNames()] - List of build packages.
 * @params {Boolean} [args.copyHtaccessSample=false] - Copy of htaccess for build dir if true.
 */
export default class PolymerBuild {
  constructor (args) {
    if (!args) {
      this.validateArgv()
    } else if (!args.baseURI) {
      throw Error('Please provide baseURI argument to work with this build')
    }

    this.args = formatArguments(args || this.argv)

    if (!/^(\/|\w+:\/{2}).+\/$/.test(this.args.baseURI)) {
      throw Error('Invalid argument baseURI. Please use `/path/to/use/` or `http://exemple.com/` format')
    }
  }

  /**
   * Validate CLI arguments.
   */
  validateArgv = () => {
    this.argv = yargs
      .usage('Usage: udes polymer-build -u /baseURI/ [-n bundled es6-unbundled ...] [-abc]')
      .option('addBuildDir', {
        alias: 'a',
        describe: 'Append buildDir to base href and Rewritebase if true',
        default: false,
      })
      .option('addBuildName', {
        describe: 'Append build name to base href and Rewritebase if true',
        default: false,
      })
      .option('baseURI', {
        alias: 'u',
        describe: 'HTML base URI for href values',
      })
      .option('build', {
        alias: 'b',
        default: true,
        describe: 'Execute `polymer build` command before executing script if true',
      })
      .option('buildNames', {
        alias: 'n',
        choices: ['bundled', 'unbundled', 'es5-bundled', 'es6-bundled', 'es6-unbundled'],
        describe: 'List of build packages',
        type: 'array',
      })
      .option('copyHtaccessSample', {
        alias: 'c',
        default: false,
        describe: 'Copy of htaccess for build dir if true',
      })
      .alias('h', 'help')
      .array('buildNames')
      .demandOption(['baseURI'], 'Please provide -baseURI argument to work with this build')
      .help('h')
      .argv
  }

  /**
   * Copy sample htaccess file to the build
   * directory and replace RewriteBase entry.
   */
  formatHtaccess = () => {
    const sampleFile = 'htaccess.sample'
    logger.log(`Copy of ${sampleFile} to ${this.buildDir}.htaccess ...`)

    if (!fs.existsSync(sampleFile)) {
      throw Error(`${sampleFile} file not found`)
    }

    let sample = fs.readFileSync(sampleFile).toString()

    sample = sample.replace(
      /RewriteBase[\s]+.*/,
      `RewriteBase ${this.baseURL}`
    )

    fs.writeFileSync(`${this.buildDir}/.htaccess`, sample)

    logger.log('Copy completed!')
  }

  /**
   * Replace base tag's href property.
   * @param {String} html - HTML string.
   * @returns {string} HTML with replaced base tag.
   */
  modifyMetaBase = html => html.replace(
    /base\shref="[\w/~-]*"/,
    `base href="${this.baseURL}"`
  )

  /**
   * Replace script tags with inline JavaScript.
   * @param {String} html - HTML string.
   * @returns {string} HTML with replaced base tag.
   */
  inlineJs = (html) => {
    const SOURCE_MATCH = 2
    const getInlineTag = string => /<script inline(="")? src="([\w/~-]+.js)"><\/script>/.exec(string)
    let string = html
    let match = getInlineTag(string)

    while (match) {
      const source = match[SOURCE_MATCH]
      const code = fs.readFileSync(`${this.buildDir}/${source}`).toString()

      string = string.replace(
        new RegExp(`<script inline(="")? src="${source}"></script>`),
        `<script>${UglifyJS.minify(code).code}</script>`
      )

      fs.unlinkSync(`${this.buildDir}/${source}`)
      match = getInlineTag(string)
    }

    return string
  }

  /**
   * Refactor index.html files.
   */
  formatIndexHtml = () => {
    const index = `${this.buildDir}/index.html`

    if (!fs.existsSync(index)) {
      throw Error(`${index} file not found`)
    }

    let html = fs.readFileSync(index).toString()
    html = this.modifyMetaBase(html)
    html = this.inlineJs(html)

    fs.writeFileSync(index, html)
  }

  /**
   * Delete index.php file from build directory.
   */
  removeIndexPhp = () => {
    if (fs.existsSync(`${this.buildDir}/index.php`)) {
      fs.unlinkSync(`${this.buildDir}/index.php`)
    }
  }

  /**
   * Return the base URL.
   * @param {String} buildName - Build name from arguments or polymer config.
   * @return {String} Base URL.
   */
  getBaseURL = (buildName) => {
    const {
      addBuildDir,
      addBuildName,
      baseURI,
      dir,
    } = this.args

    return `${baseURI}${addBuildDir ? dir : ''}${addBuildName ? `${buildName}/` : ''}`
  }

  /**
   * Update build files depending on environment settings.
   * @param {String} buildName - Build name from arguments or polymer config.
   */
  updateBuildFiles = (buildName) => {
    this.buildDir = `${this.args.dir}${buildName}/`
    this.baseURL = this.getBaseURL(buildName)
    logger.log(`Build directory: ${this.buildDir}`)

    this.formatIndexHtml()

    if (this.args.copyHtaccessSample) {
      this.formatHtaccess()
    } else {
      this.removeIndexPhp()
    }
  }

  /**
   * Execute code for building polymer project.
   */
  run = () => {
    if (this.args.build) {
      shell.exec('polymer build')
    }

    try {
      this.args.buildNames.forEach(this.updateBuildFiles)
    } catch (error) {
      logger.error(error.toString())
    }
  }
}
