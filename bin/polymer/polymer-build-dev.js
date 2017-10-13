#! /usr/bin/env node

const shell = require('shelljs');
const argv = require('yargs')
  .usage('Usage: $0 [buildName]')
  .option('buildName', {
    alias: 'b',
    describe: 'Choose a build',
    choices: ['bundled', 'unbundled', 'es5-bundled', 'es6-bundled']
  })
  .default('buildName', 'bundled')
  .help('h')
  .alias('h', 'help')
  .argv;

console.log(argv.buildName);

shell.exec('polymer build && node ../../src/polymer/index.js -- -addBuildDir=true');
