/**
 * Created by fgam2701 on 2017-07-19.
 *
 * Arguments :
 *
 * @param {string} -rootURI
 * Bla bla
 *
 *      -rootURI='~webv9201/nsquart2/inscription-fcnc/'
 *
 * @param {boolean} -rewriteBuildDev (optional)
 * Bla bla
 *
 *      -rewriteBuildDev=true
 *
 * @param {string} -buildFolder (optional)
 * Par défaut : 'build/'
 *
 *      -buildFolder='output/'
 *
 * // TODO
 * @param {string} -buildName (optional)
 * Par défaut : -buildName=bundled et -buildName=unbundled
 *
 * # Exemple :
 *
 *      node index.js -- -addBuildDir=true -rootURI='~webv9201/nsquart2/inscription-fcnc/'
 *
 *      npm run build -- -rootURI='~webv9201/nsquart2/inscription-fcnc/'
 *
 */
import cpx from 'cpx'
import fs from 'fs'
import replace from 'replace-in-file'
import inline from 'inline-source'
import path from 'path'

const debug = true;
const logger = {
  ...console,
  debug: (...args) => {
    if (debug) {
      console.log(...args)
    }
  },
  error: (error) => {
    console.error(`[1;31m \n\n===========\nERROR!!!!\n${error}\n===============\n`)
  },
}

function formatDir (directory) {
  const dir = directory.replace(/^\//, '').replace(/([^/])$/, '$&/')
  logger.debug(`\tdir: ${dir}`)
  return dir
}

/**
 *
 * @param arguments
 */
function getArguments (argv) {
  logger.debug('argv', argv)
  const defaultArgs = {
    dir: 'build/',
    devdir: null,
    buildNames: [],
    rewriteBuildDev: false,
  }

  const args = argv.reduce((acc, cur) => {
    const { 0: key, 1: value } = cur.split('=')

    switch (key) {
      case '-rewriteBuildDev' :
        logger.debug('\t.htaccess Rewrite without build directory: true\n')
        return { ...acc, rewriteBuildDev: true }
      case '-rootURI' :
        return { ...acc, devdir: formatDir(value) }
      case '-buildName' :
        return { ...acc, buildNames: value.split(',') }
      case '-buildFolder' :
        return { ...acc, dir: formatDir(value) }
    }
  }, {})

  if (!args.devdir) {
    const error = 'Undefined argument `-rootURI`'
    throw error
  }

  if (!args.buildNames.length) {
    delete args.buildNames
  }

  return { ...defaultArgs, ...args }
}

function copyHtaccess (buildDir) {
  const sourceHtaccess = 'htaccess.sample'
  const htaccessSample = `${buildDir}/${sourceHtaccess}`
  const htaccess = `${buildDir}/.htaccess`

  if (!fs.existsSync(sourceHtaccess)) {
    const error = `Error, file ${sourceHtaccess} not found.`
    throw error
  }

  logger.log(`\tCopy of .htaccess.sample to ${buildDir}...`)
  cpx.copySync(sourceHtaccess, buildDir)

  logger.log(`\tRename ${htaccessSample} to ${htaccess}...`)
  fs.renameSync(htaccessSample, htaccess)

  if (!fs.existsSync(htaccess)) {
    const error = `Error, file ${htaccess} not found`
    throw error
  }

  logger.log('\tRename completed!\n')
}

function replaceRewriteHtaccess (buildDir, { devdir, rewriteBuildDev }) {
  const htaccess = `${buildDir}/.htaccess`

  logger.log(`\tReplacing the RewriteBase for ${htaccess} ...`)
  const changedFiles = replace.sync({
    files: htaccess,
    from: /RewriteBase[\s]+.*/,
    to: `RewriteBase /${devdir}${rewriteBuildDev ? buildDir : ''}`,
  })

  if (!changedFiles.length) {
    const error = '.htaccess not modified'
    throw error
  }

  logger.log('\t.htaccess modified!\n')
}

function modifyMetaBaseIndex (buildDir) {
  const index = `${buildDir}/_index.html`

  console.log(`\tReplace <meta base> of ${index} ...`)
  const changedFiles = replace.sync({
    files: index,
    from: /base\shref="https:\/\/www.usherbrooke.ca[\w\d\-~=+#/]*/,
    to: 'base href="/', // For local execution only.
  })

  console.log(`\t_index.html modified: ${!!changedFiles.length} \n`)
}

function modifyInlineIndex (buildDir) {
  const index = `${buildDir}/_index.html`

  console.log(`\tReplace <src inline=""> with <src inline> in ${index} ...`)
  const changedFiles = replace.sync({
    files: index,
    from: /inline=""/g,
    to: 'inline',
  })

  if (!changedFiles.length) {
    const error = `No replacement of « inline="" » in ${index}`
    throw error
  }

  console.log(`\tReplace <src inline> Ok!\n`)
}

function compressInlineIndex (buildDir) {
  const index = `${buildDir}/_index.html`

  console.log(`\tMinify and compress <src inline> in ${index} ...`)
  const html = inline.sync(path.resolve(index), {
    compress: true,
    rootpath: path.resolve('./'),
  })

  if (!html) {
    const error = '.htaccess not compressed'
    throw error
  }

  console.log('\tMinify and compress <src inline> Ok!\n')
}

try {
  const args = getArguments(process.argv)

  args.buildNames.forEach((buildName) => {
    const buildDir = `${args.dir}${buildName}`
    logger.log(`Build directory: ${buildDir}`)

    copyHtaccess(buildDir)
    replaceRewriteHtaccess(buildDir, args)
    modifyMetaBaseIndex(buildDir)
    modifyInlineIndex(buildDir)
    compressInlineIndex(buildDir)
  })

  process.exit(0)
} catch (error) {
  logger.error(error)
  process.exit(1)
}
