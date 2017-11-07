import yargs from 'yargs'

/**
 * @class
 */
export default class Publish {
  constructor (args) {
    if (!args) {
      this.validateArgv()
    } else if (!args.rootURI) {
      throw new Error('Please provide rootURI argument to work with this build')
    }
    this.args = this.formatArguments(args || this.argv)
  }

  /**
   * Execute code for building polymer project.
   */
  run = () => {
    this.bumpVersion()
  }

  /**
   * Validate CLI arguments.
   */
  validateArgv = () => {
    this.argv = yargs
      .usage('Usage: $0 -r rootURI [--buildName name1 name2 ...] [-a addBuildDir]')
      .option('releaseType', {
        alias: '',
        describe: 'Type of release',
        choices: ['major', 'minor', 'patch'],
      })
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
    return args
  }

  bumpVersion = () => {

  }
}
