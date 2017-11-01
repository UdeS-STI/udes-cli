import yargs from 'yargs'

const formatArguments = (args) => {
  return args
}

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
    this.args = formatArguments(args || this.argv)
  }

  /**
   * Validate CLI arguments.
   */
  validateArgv = () => {
    this.argv = yargs.usage('Usage: $0 -r rootURI [--buildName name1 name2 ...] [-a addBuildDir]')
      .option('type', {
        alias: 't',
        describe: 'Type of release',
        choices: ['major', 'minor', 'patch'],
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
   * Execute code for building polymer project.
   */
  run() {

  }
}
