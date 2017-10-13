#! /usr/bin/env node

const shell = require('shelljs');
const argv = require('yargs')
  .usage('Usage: $0 -r rootURI [-b buildName]')
  .option('buildName', {
    alias: 'b',
    describe: 'Choose a build',
    choices: ['bundled', 'unbundled', 'es5-bundled', 'es6-bundled']
  })
  .option('-rootURI', {
    alias: 'r',
    describe: 'Choose a build'
  })
  .demandOption(['-rootURI'], 'Please provide -rootURI argument to work with this build')
  .default('buildName', 'bundled')
  .help('h')
  .alias('h', 'help')
  .argv;

console.log(argv.buildName);

shell.exec("polymer build && npm install && node ../../src/polymer/index.js -- -rootURI='~webv9201/nsquart2/inscription-fcnc/'");