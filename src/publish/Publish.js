import shell from 'shelljs'
import yargs from 'yargs'

import { udesLogger } from 'udes-logger'
/**
 * @class
 */
export default class Publish {
  constructor (args) {
    if (!args) {
      this.validateArgv()
    } else if (!args.type) {
      throw new Error('Please provide type argument to publish');
    }

    this.args = this.formatArguments(args || this.argv)
    this.shell = {
      exec (arg) {
        console.log(arg)
        shell.exec(arg)
      },
    }
  }

  /**
   * Execute code for building polymer project.
   */
  run = () => {
    if (this.canRelease()) {
      this.shell.exec('git checkout master && git pull origin master')
      this.shell.exec('git checkout -b bump-version')
      this.shell.exec('npm install')
      // this.shell.exec(`npm version ${this.args.type}`)
      // this.shell.exec('npm git-tag-version')
    }
  }

  canRelease = () => {
    try {
      const test = this.shell.exec('npm run lint', { silent: true }, (...arg) => console.log('ARGS', ...arg))
      console.log(test)
      this.shell.exec('npm run audit')
      this.shell.exec('npm run test')
      console.log('can release')
      return true
    } catch (error) {
      console.log(error)
      udesLogger.debug(error)
      return false
    }
  }

  /**
   * Validate CLI arguments.
   */
  validateArgv = () => {
    this.argv = yargs
      .usage('Usage: $0 -r rootURI [--buildName name1 name2 ...] [-a addBuildDir]')
      .option('type', {
        alias: 't',
        describe: 'Type of release',
        choices: ['major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'prerealease'],
      })
      .demandOption(['type'], 'Please provide --type argument to publish')
      .help('h')
      .alias('h', 'help')
      .argv
  }

  /**
   * @private
   * @param args
   * @returns {*}
   */
  formatArguments = (args) => {
    return {
      type: args.type,
    }
  }
}
