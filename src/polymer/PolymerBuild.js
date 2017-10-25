import cpx from 'cpx'
import fs from 'fs'
import inline from 'inline-source'
import path from 'path'
import replace from 'replace-in-file'
import yargs from 'yargs'

import { logger } from '../lib/utils'

/**
 * Ensures that the directory is in a standard format.
 * @param {String} dir - A directory path.
 * @returns {String} Properly formatted directory (dir/example/).
 */
const formatDir = dir => dir.replace(/^\//, '').replace(/([^/])$/, '$&/')

/**
 * Converts command line arguments into a usable object.
 * @param {[String]} args - Arguments passed through command line.
 * @returns {Object} Arguments in a formatted object.
 */
const formatArguments = (args) => {
  if (!args.rootURI) {
    throw new Error('Undefined argument `-rootURI`')
  }

  let defaultBuildNames
  const dir = 'build/'

  try {
    const polymerConfig = JSON.parse(fs.readFileSync(`${dir}polymer.json`))
    defaultBuildNames = polymerConfig.builds.map(({ name, preset }) => name || preset)
  } catch (err) {
    defaultBuildNames = ['bundled', 'unbundled', 'es5-bundled']
  }

  const {
    buildName = defaultBuildNames,
    rewriteBuildDev,
    rootURI,
  } = args

  if (rewriteBuildDev) {
    logger.debug('.htaccess Rewrite without build directory: true')
  }

  return {
    buildNames: (Array.isArray(buildName)) ? buildName : [buildName],
    devdir: formatDir(rootURI),
    dir,
    rewriteBuildDev,
  }
}

/**
 * @param {String} -rootURI - Choose a build (eg.: -rootURI='~webv9201/nsquart2/inscription-fcnc/')
 * @param {Boolean} [-rewriteBuildDev] - If true rewrite of htaccess for build directory (eg: -rewriteBuildDev=true)
 * @param {[String]} [-buildName=['bundled', 'unbundled']] (optional)
 * @example
 * node PolymerBuild.js -- -addBuildDir=true -rootURI='~webv9201/nsquart2/inscription-fcnc/'
 * npm run build -- -rootURI='~webv9201/nsquart2/inscription-fcnc/'
 */
export default class PolymerBuild {
  constructor (args) {
    this.validateArgv()
    this.args = formatArguments(args)
  }

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
    const htaccessSample = `${this.args.buildDir}/${sourceHtaccess}`
    const htaccess = `${this.args.buildDir}/.htaccess`

    if (!fs.existsSync(sourceHtaccess)) {
      throw new Error(`Error, file ${sourceHtaccess} not found.`)
    }

    logger.log(`Copy of .htaccess.sample to ${this.args.buildDir}...`)
    cpx.copySync(sourceHtaccess, this.args.buildDir)

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
    const { buildDir, devdir, rewriteBuildDev } = this.args
    const htaccess = `${buildDir}/.htaccess`
    const to = (rewriteBuildDev) ? `RewriteBase /${devdir}${buildDir}` : `RewriteBase /${devdir}`

    logger.log(`Replacing the RewriteBase for ${htaccess} ...`)
    const changedFiles = replace.sync({
      files: htaccess,
      from: /RewriteBase[\s]+.*/,
      to: to,
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
    const index = `${this.args.buildDir}/_index.html`

    logger.log(`Replace <meta base> of ${index}...`)
    const changedFiles = replace.sync({
      files: index,
      from: /base\shref="(.*)"/, // For local execution only.
      to: `base href="https://www.usherbrooke.ca/${this.args.devdir}"`,
    })

    logger.log(`_index.html modified: ${!!changedFiles.length}`)
  }

  /**
   * Update src tags in index files.
   */
  modifyInlineIndex = () => {
    const index = `${this.args.buildDir}/_index.html`

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
   * @throws {Error} If no file is compressed.
   */
  compressInlineIndex = () => {
    const index = `${this.args.buildDir}/_index.html`

    logger.log(`Minify and compress <src inline> in ${index}...`)
    const html = inline.sync(path.resolve(index), {
      compress: true,
      rootpath: path.resolve('./'),
    })

    if (!html) {
      throw new Error(`${index} not compressed`)
    }

    logger.log('Minify and compress <src inline> Ok!')
  }

  run = () => {
    try {
      this.args.buildNames.forEach((buildName) => {
        this.buildDir = `${this.args.dir}${buildName}`
        logger.log(`Build directory: ${this.buildDir}`)

        this.copyHtaccess()
        this.replaceRewriteHtaccess()
        this.modifyMetaBaseIndex()
        this.modifyInlineIndex()
        this.compressInlineIndex()
      })

      process.exit(0)
    } catch (error) {
      logger.error(error)
      process.exit(1)
    }
  }
}
