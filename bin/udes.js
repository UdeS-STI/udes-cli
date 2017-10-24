#! /usr/bin/env node
const shell = require('shelljs')
const argv = require('yargs')
  .usage('Usage: $0 -r rootURI [--buildName name1 name2 ...] [-a addBuildDir]')
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
  .help('h')
  .alias('h', 'help')
  .argv

console.log(argv)
shell.exec('babel-node node_modules/udes-cli/src/udes.js')
