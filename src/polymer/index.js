import cpx from 'cpx'
import fs from 'fs'
import replace from 'replace-in-file'
import inline from 'inline-source'
import path from 'path'

import { getArguments, logger } from '../lib/utils'

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

  const {
    buildFolder = 'build/',
    buildName = ['bundled', 'unbundled', 'es5-bundled'],
    rewriteBuildDev,
    rootURI,
  } = args

  if (rewriteBuildDev) {
    logger.debug('.htaccess Rewrite without build directory: true')
  }

  return {
    buildNames: buildName,
    devdir: formatDir(rootURI),
    dir: formatDir(buildFolder),
    rewriteBuildDev,
  }
}

/**
 * Copy sample htaccess file to the build directory.
 * @param {String} buildDir - Location of build directory.
 * @throws {Error} If copy fails.
 */
const copyHtaccess = (buildDir) => {
  const sourceHtaccess = 'htaccess.sample'
  const htaccessSample = `${buildDir}/${sourceHtaccess}`
  const htaccess = `${buildDir}/.htaccess`

  if (!fs.existsSync(sourceHtaccess)) {
    throw new Error(`Error, file ${sourceHtaccess} not found.`)
  }

  logger.log(`Copy of .htaccess.sample to ${buildDir}...`)
  cpx.copySync(sourceHtaccess, buildDir)

  logger.log(`Rename ${htaccessSample} to ${htaccess}...`)
  fs.renameSync(htaccessSample, htaccess)

  if (!fs.existsSync(htaccess)) {
    throw new Error(`Error, file ${htaccess} not found`)
  }

  logger.log('Rename completed!')
}

/**
 * Update RewriteBase info in htaccess file.
 * @param {String} buildDir - Location of build directory.
 * @param {String} devdir -Build directory
 * @param {Boolean} rewriteBuildDev - If true rewrite of htaccess for build directory
 * @throws {Error} If fails to update htaccess file.
 */
const replaceRewriteHtaccess = (buildDir, devdir, rewriteBuildDev) => {
  const htaccess = `${buildDir}/.htaccess`

  logger.log(`Replacing the RewriteBase for ${htaccess} ...`)
  const changedFiles = replace.sync({
    files: htaccess,
    from: /RewriteBase[\s]+.*/,
    to: `RewriteBase /${devdir}${rewriteBuildDev ? buildDir : ''}`,
  })

  if (!changedFiles.length) {
    throw new Error('.htaccess not modified')
  }

  logger.log('.htaccess modified!')
}

/**
 * update meta tags in index files.
 * @param {String} buildDir - Location of build directory.
 */
const modifyMetaBaseIndex = (buildDir) => {
  const index = `${buildDir}/_index.html`

  logger.log(`Replace <meta base> of ${index}...`)
  const changedFiles = replace.sync({
    files: index,
    from: /base\shref="https:\/\/www.usherbrooke.ca[\w\d\-~=+#/]*/,
    to: 'base href="/', // For local execution only.
  })

  logger.log(`_index.html modified: ${!!changedFiles.length}`)
}

/**
 * Update src tags in index files.
 * @param {String} buildDir - Location of build directory.
 */
const modifyInlineIndex = (buildDir) => {
  const index = `${buildDir}/_index.html`

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
 * @param {String} buildDir - Location of build directory.
 * @throws {Error} If no file is compressed.
 */
const compressInlineIndex = (buildDir) => {
  const index = `${buildDir}/_index.html`

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

/**
 * @param {String} -rootURI - Choose a build (eg.: -rootURI='~webv9201/nsquart2/inscription-fcnc/')
 * @param {Boolean} [-rewriteBuildDev] - If true rewrite of htaccess for build directory (eg: -rewriteBuildDev=true)
 * @param {String} [-buildFolder='build/'] - Build directory
 * @param {[String]} [-buildName=['bundled', 'unbundled']] (optional)
 * @example
 * node index.js -- -addBuildDir=true -rootURI='~webv9201/nsquart2/inscription-fcnc/'
 * npm run build -- -rootURI='~webv9201/nsquart2/inscription-fcnc/'
 */
try {
  const { buildNames, devdir, dir, rewriteBuildDev } = formatArguments(getArguments())

  buildNames.forEach((buildName) => {
    const buildDir = `${dir}${buildName}`
    logger.log(`Build directory: ${buildDir}`)

    copyHtaccess(buildDir)
    replaceRewriteHtaccess(buildDir, devdir, rewriteBuildDev)
    modifyMetaBaseIndex(buildDir)
    modifyInlineIndex(buildDir)
    compressInlineIndex(buildDir)
  })

  process.exit(0)
} catch (error) {
  logger.error(error)
  process.exit(1)
}
