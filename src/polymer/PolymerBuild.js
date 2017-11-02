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
    build = true,
    buildNames = getDefaultBuildNames(),
    rewriteBuildDev = false,
    baseURI,
  } = args

  if (rewriteBuildDev) {
    logger.debug('.htaccess Rewrite without build directory: true')
  }

  return {
    build,
    buildNames: (Array.isArray(buildNames)) ? buildNames : [buildNames],
    devdir: baseURI.replace(/^\//, '').replace(/([^/])$/, '$&/'),
    dir,
    rewriteBuildDev,
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
  }

  /**
   * Validate CLI arguments.
   */
  validateArgv = () => {
    this.argv = yargs.usage('Usage: $0 -r baseURI [--buildNames name1 name2 ...] [-a addBuildDir]')
      .option('rewriteBuildDev', {
        alias: 'r',
        describe: 'Rewrite of htaccess for build dir if true',
      })
      .option('buildNames', {
        alias: 'b',
        describe: 'Choose a build',
        choices: ['bundled', 'unbundled', 'es5-bundled', 'es6-bundled', 'es6-unbundled'],
        type: 'array',
      })
      .option('baseURI', {
        alias: 'u',
        describe: 'Choose a build',
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
  handleHtaccess = () => {
    logger.log(`Copy of .htaccess.sample to ${this.buildDir}/.htaccess ...`)
    const sampleDir = 'htaccess.sample'
    const { devdir, rewriteBuildDev } = this.args

    if (!fs.existsSync(sampleDir)) {
      const error = 'Sample htaccess file not found'
      throw error
    }

    let sample = fs.readFileSync('htaccess.sample').toString()

    sample = sample.replace(
      /RewriteBase[\s]+.*/,
      `RewriteBase /${devdir}${rewriteBuildDev ? this.buildDir : ''}`
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
    const { devdir, rewriteBuildDev } = this.args
    return html.replace(
      /base\shref="[\w/~-]*"/,
      `base href="/${devdir}${rewriteBuildDev ? this.buildDir : ''}"`
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
  handleIndexFile = () => {
    const index = `${this.buildDir}/_index.html`

    if (!fs.existsSync(index)) {
      const error = `${index} file not found`
      throw error
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
   * Rename _index.html file in build directory.
   */
  renameIndexHtml = () => {
    if (fs.existsSync(`${this.buildDir}/_index.html`)) {
      fs.renameSync(`${this.buildDir}/_index.html`, `${this.buildDir}/index.html`)
    }
  }

  /**
   * Update build files depending on environment settings.
   * @param {String} buildName - Build name from arguments or polymer config.
   */
  handleBuild = (buildName) => {
    this.buildDir = `${this.args.dir}${buildName}`
    logger.log(`Build directory: ${this.buildDir}`)

    this.handleIndexFile()

    if (this.args.rewriteBuildDev) {
      // Dev environment
      this.handleHtaccess()
    } else {
      // Production environment
      this.removeIndexPhp()
      this.renameIndexHtml()
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
      this.args.buildNames.forEach(this.handleBuild)
    } catch (error) {
      logger.error(error)
    }
  }
}
