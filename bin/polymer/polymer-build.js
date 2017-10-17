#! /usr/bin/env node
import shell from 'shelljs'

const argv = require('yargs')
  .usage('Usage: $0 -r rootURI [--buildName name1 name2 ...] [-a addBuildDir]')
  .option('rewriteBuildDev', {
    alias: 'r',
    describe: 'Rewrite of htaccess for build dir if true',
  })
  .option('buildName', {
    alias: 'b',
    describe: 'Choose a build',
    choices: ['bundled', 'unbundled', 'es5-bundled', 'es6-bundled'],
    type: 'array',
  })
  .option('rootURI', {
    alias: 'u',
    describe: 'Choose a build',
  })
  .array('buildName')
  .demandOption(['rootURI'], 'Please provide -rootURI argument to work with this build')
  .default('buildName', 'bundled')
  .help('h')
  .alias('h', 'help')
  .argv

if (argv.rewriteBuildDev) {
  shell.exec(`polymer build && npm install && node node_modules/udes-cli/src/polymer/index.js -- -rootURI=${argv.rootURI} -buildName=${argv.buildName} -rewriteBuildDev=true`)
} else {
  shell.exec(`polymer build && npm install && node node_modules/udes-cli/src/polymer/index.js -- -rootURI=${argv.rootURI} -buildName=${argv.buildName}`)
}
