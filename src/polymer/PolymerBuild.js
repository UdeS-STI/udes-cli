import cpx from 'cpx'
import fs from 'fs'
import replace from 'replace-in-file'
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
   * @throws {Error} If copy fails.
   */
  copyHtaccess = () => {
    const sourceHtaccess = 'htaccess.sample'
    const htaccessSample = `${this.buildDir}/${sourceHtaccess}`
    const htaccess = `${this.buildDir}/.htaccess`

    if (!fs.existsSync(sourceHtaccess)) {
      throw new Error(`Error, file ${sourceHtaccess} not found.`)
    }

    logger.log(`Copy of .htaccess.sample to ${this.buildDir}...`)
    cpx.copySync(sourceHtaccess, this.buildDir)

    logger.log(`Rename ${htaccessSample} to ${htaccess}...`)
    fs.renameSync(htaccessSample, htaccess)

    if (!fs.existsSync(htaccess)) {
      throw new Error(`Error, file ${htaccess} not found`)
    }

    logger.log('Rename completed!')
  }

  /**
   * Update RewriteBase info in htaccess file.
   * @throws {Error} If fails to update htaccess file.
   */
  replaceRewriteHtaccess = () => {
    const { devdir, rewriteBuildDev } = this.args
    const htaccess = `${this.buildDir}/.htaccess`

    logger.log(`Replacing the RewriteBase for ${htaccess} ...`)
    const changedFiles = replace.sync({
      files: htaccess,
      from: /RewriteBase[\s]+.*/,
      to: `RewriteBase /${devdir}${rewriteBuildDev ? this.buildDir : ''}`,
    })

    if (!changedFiles.length) {
      throw new Error('.htaccess not modified')
    }

    logger.log('.htaccess modified!')
  }

  /**
   * update meta tags in index files.
   */
  modifyMetaBaseIndex = () => {
    const { devdir, rewriteBuildDev } = this.args
    const index = `${this.buildDir}/_index.html`

    logger.log(`Replace <meta base> of ${index}...`)
    const changedFiles = replace.sync({
      files: index,
      from: /base\shref="[\w/~-]*"/, // For local execution only.
      to: `base href="/${devdir}${rewriteBuildDev ? this.buildDir : ''}"`,
    })

    logger.log(`_index.html modified: ${!!changedFiles.length}`)
  }

  /**
   * Update src tags in index files.
   */
  modifyInlineIndex = () => {
    const index = `${this.buildDir}/_index.html`

    logger.log(`Replace <src inline=""> with <src inline> in ${index}...`)
    replace.sync({
      files: index,
      from: /inline=""/g,
      to: 'inline',
    })

    logger.log(`Replace <src inline> Ok!`)
  }

  /**
   * Minify and compress src tags in index files.
   */
  compressInlineIndex = () => {
    const getInlineTag = html => /<script inline src="([\w/~-]+.js)"><\/script>/.exec(html)
    const index = `${this.buildDir}/_index.html`

    logger.log(`Minify and compress <src inline> in ${index}...`)

    try {
      let html = fs.readFileSync(index).toString()
      let match = getInlineTag(html)

      while (match) {
        const source = match[1]
        const code = fs.readFileSync(`${this.buildDir}/${source}`).toString()
        const minifiedCode = UglifyJS.minify(code).code

        html = html.replace(
          `<script inline src="${source}"></script>`,
          `<script>${minifiedCode}</script>`
        )
        match = getInlineTag(html)
      }

      fs.writeFileSync(index, html)
      logger.log('Minify and compress <src inline> Ok!')
    } catch (err) {
      logger.error(err)
    }
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
   * Execute code for building polymer project.
   */
  run = () => {
    if (this.args.build) {
      shell.exec('polymer build')
    }

    try {
      this.args.buildNames.forEach((buildName) => {
        this.buildDir = `${this.args.dir}${buildName}`
        logger.log(`Build directory: ${this.buildDir}`)

        this.modifyMetaBaseIndex()
        this.modifyInlineIndex()
        this.compressInlineIndex()

        if (this.args.rewriteBuildDev) {
          // Dev environment
          this.copyHtaccess()
          this.replaceRewriteHtaccess()
        } else {
          // Production environment
          this.removeIndexPhp()
          this.renameIndexHtml()
        }
      })

      process.exit(0)
    } catch (error) {
      logger.error(error)
      process.exit(1)
    }
  }
}
