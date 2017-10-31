import fs from 'fs'
import shell from 'shelljs'
import UglifyJS from 'uglify-es'
import yargs from 'yargs'

import { logger } from '../lib/logger'

/**
 * Converts command line arguments into a usable object.
 * @private
 * @param {[String]} args - Arguments passed through command line.
 * @returns {Object} Arguments in a formatted object.
 */
const formatArguments = (args) => {
  let defaultBuildNames
  const dir = 'build/'

  try {
    const polymerConfig = JSON.parse(fs.readFileSync(`${dir}polymer.json`))
    defaultBuildNames = polymerConfig.builds.map(({ name, preset }) => name || preset)
  } catch (err) {
    defaultBuildNames = ['bundled', 'unbundled', 'es5-bundled']
  }

  const {
    build = true,
    buildName = defaultBuildNames,
    rewriteBuildDev = false,
    rootURI,
  } = args

  if (rewriteBuildDev) {
    logger.debug('.htaccess Rewrite without build directory: true')
  }

  return {
    build,
    buildNames: (Array.isArray(buildName)) ? buildName : [buildName],
    devdir: rootURI.replace(/^\//, '').replace(/([^/])$/, '$&/'),
    dir,
    rewriteBuildDev,
  }
}

/**
 * Class to handle actions related to building a polymer project.
 * @class
 */
export default class PolymerBuild {
  constructor (args) {
    if (!args) {
      this.validateArgv()
    } else if (!args.rootURI) {
      throw new Error('Please provide rootURI argument to work with this build')
    }
    this.args = formatArguments(args || this.argv)
  }

  /**
   * Validate CLI arguments.
   */
  validateArgv = () => {
    this.argv = yargs.usage('Usage: $0 -r rootURI [--buildName name1 name2 ...] [-a addBuildDir]')
      .option('rewriteBuildDev', {
        alias: 'r',
        describe: 'Rewrite of htaccess for build dir if true',
      })
      .option('buildName', {
        alias: 'b',
        describe: 'Choose a build',
        choices: ['bundled', 'unbundled', 'es5-bundled', 'es6-bundled', 'es6-unbundled'],
        type: 'array',
      })
      .option('rootURI', {
        alias: 'u',
        describe: 'Choose a build',
      })
      .array('buildName')
      .demandOption(['rootURI'], 'Please provide -rootURI argument to work with this build')
      .help('h')
      .alias('h', 'help')
      .argv
  }

  /**
   * Copy sample htaccess file to the build directory.
   */
  hanldeHtaccess = () => {
    logger.log(`Copy of .htaccess.sample to ${this.buildDir}/.htaccess ...`)
    const { devdir, rewriteBuildDev } = this.args
    let sample = fs.readFileSync('htaccess.sample').toString()

    sample = sample.replace(
      /RewriteBase[\s]+.*/,
      `RewriteBase /${devdir}${rewriteBuildDev ? this.buildDir : ''}`
    )

    fs.writeFileSync(`${this.buildDir}/.htaccess`, sample)

    logger.log('Copy completed!')
  }

  modifyMetaBase = (html) => {
    const { devdir, rewriteBuildDev } = this.args
    return html.replace(
      /base\shref="[\w/~-]*"/,
      `base href="/${devdir}${rewriteBuildDev ? this.buildDir : ''}"`
    )
  }

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
   * Minify and compress src tags in index files.
   */
  handleIndexFile = () => {
    const index = `${this.buildDir}/_index.html`

    logger.log(`Minify and compress <src inline> in ${index}...`)

    let html = fs.readFileSync(index).toString()
    html = this.modifyMetaBase(html)
    html = this.inlineJs(html)

    fs.writeFileSync(index, html)
    logger.log('Minify and compress <src inline> Ok!')
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

  handleBuild = (buildName) => {
    this.buildDir = `${this.args.dir}${buildName}`
    logger.log(`Build directory: ${this.buildDir}`)

    this.handleIndexFile()

    if (this.args.rewriteBuildDev) {
      // Dev environment
      this.hanldeHtaccess()
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
      process.exit(1)
    }
  }
}
