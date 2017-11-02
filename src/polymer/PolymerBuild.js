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
    baseURI,
    build,
    buildNames: (Array.isArray(buildNames)) ? buildNames : [buildNames],
    dir,
    copyHtaccessSample,
  }
}

/**
 * Class to handle actions related to building a polymer project.
 * @class
 * @params {Object} [args] - Build arguments when not using command line.
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
      .option('build', {
        alias: 'b',
        describe: 'Execute `polymer build` command before executing script if true',
        default: true,
      })
      .option('copyHtaccessSample', {
        alias: 'c',
        describe: 'Copy of htaccess for build dir if true',
        default: false,
      })
      .option('buildNames', {
        alias: 'n',
        describe: 'List of build packages',
        choices: ['bundled', 'unbundled', 'es5-bundled', 'es6-bundled', 'es6-unbundled'],
        type: 'array',
      })
      .option('baseURI', {
        alias: 'u',
        describe: 'HTML base URI for href values',
      })
      .array('buildNames')
      .demandOption(['baseURI'], 'Please provide -baseURI argument to work with this build')
      .help('h')
      .alias('h', 'help')
      .argv
  }

  /**
   * Copy sample htaccess file to the build
   * directory and replace RewriteBase entry.
   */
  formatHtaccess = () => {
    logger.log(`Copy of .htaccess.sample to ${this.buildDir}/.htaccess ...`)
    const sampleDir = 'htaccess.sample'
    const { addBuildDir, baseURI } = this.args

    if (!fs.existsSync(sampleDir)) {
      throw Error('Sample htaccess file not found')
    }

    let sample = fs.readFileSync('htaccess.sample').toString()

    sample = sample.replace(
      /RewriteBase[\s]+.*/,
      `RewriteBase ${baseURI}${addBuildDir ? this.buildDir : ''}`
    )

    fs.writeFileSync(`${this.buildDir}/.htaccess`, sample)

    logger.log('Copy completed!')
  }

  /**
   * Replace base tag's href property.
   * @param {String} html - HTML string.
   * @returns {string} HTML with replaced base tag.
   */
  modifyMetaBase = (html) => {
    const { addBuildDir, baseURI } = this.args
    return html.replace(
      /base\shref="[\w/~-]*"/,
      `base href="${baseURI}${addBuildDir ? this.buildDir : ''}"`
    )
  }

  /**
   * Replace script tags with inline JavaScript.
   * @param {String} html - HTML string.
   * @returns {string} HTML with replaced base tag.
   */
  inlineJs = (html) => {
    const getInlineTag = string => /<script inline(="")? src="([\w/~-]+.js)"><\/script>/.exec(string)
    let string = html
    let match = getInlineTag(string)

    while (match) {
      const source = match[2]
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
   * Update build files depending on environment settings.
   * @param {String} buildName - Build name from arguments or polymer config.
   */
  updateBuildFiles = (buildName) => {
    this.buildDir = `${this.args.dir}${buildName}`
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
