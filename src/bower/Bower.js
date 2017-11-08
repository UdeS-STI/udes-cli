import shell from 'shelljs'
import yargs from 'yargs'

/**
 * Class to handle actions related to building a polymer project.
 * @class
 * @param {Object} args - Bower arguments when not using command line.
 * @throws {Error} When invalid command is entered.
 */
export default class Bower {
  constructor (args) {
    if (!args) {
      this.validateArgv()
    }

    this.args = this.formatArguments(args || this.argv)
    this.shell = shell

    if (!this[this.args.command]) {
      throw new Error(`Invalid command: ${this.args.command}`)
    }
  }

  /**
   * Execute bower tasks.
   * @public
   */
  run = () => {
    this[this.args.command](this.args.packageName)
  }

  /**
   * Validate CLI arguments.
   * @private
   */
  validateArgv = () => {
    this.argv = yargs
      .command('bower <command> [package..] [options..]', 'Use bower tools', (yargs) => {
        yargs
          .positional('command', {
            describe: 'bower command to execute',
            type: 'string',
            choices: [
              'install',
              'lock',
              'status',
              'uninstall',
              'unlock',
              'update',
              'validate',
            ],
          })
          .positional('package', {
            describe: 'package(s) to install',
            type: 'array',
          })
          .positional('options', {
            default: [],
            describe: 'options to pass to bower',
            type: 'array',
          })
      })
      .usage('Usage: udes bower <command> [package]')
      .describe('Execute bower and bower-locker tasks')
      .alias('h', 'help')
      .help('h')
      .argv
  }

  /**
   * Converts command line arguments into a usable object.
   * @private
   * @param {Object} args - Arguments passed through command line.
   * @returns {Object} Arguments in a formatted object.
   */
  formatArguments = args => {
    const [packageName, options] = this.splitArgvIntoOptionsPackage(args)

    return {
      command: args.command,
      options: options,
      packageName: packageName,
    }
  }

  /**
   * Split the argv and return an array of [options, packageName].
   * @private
   * @param {Object} args - Arguments passed through command line.
   * @returns {Array} Array of [options, packageName].
   */
  splitArgvIntoOptionsPackage = args => {
    if (this.argv) {
      // Remove the first four arguments from argv [node, udes, bower, install]
      const [, , , , ...argv] = [...process.argv]

      return argv.reduce((options, argv) => {
        options[/^-/.test(argv) ? 1 : 0].push(argv)
        return options
      }, [[], []])
    }

    return [args.package, args.options || []]
  }

  /**
   * Run a bower command.
   * @private
   * @param {install|uninstall|update} command - Bower command to execute.
   * @param {[String]} [packageNames=[]] - Packages affected.
   */
  bowerExecute = (command, packageNames = []) => {
    const args = [...packageNames, ...this.args.options]

    this.unlock()
    this.shell.exec(`bower ${command} ${args.join(' ')}`.trim())
    this.lock()
  }

  /**
   * Install packages.
   * @private
   * @param {[String]} [packageNames] - Packages to install.
   */
  install = (packageNames = []) => {
    this.bowerExecute('install', packageNames)
  }

  /**
   * Handle lock command.
   * @private
   */
  lock = () => {
    this.shell.exec('bower-locker lock')
  }

  /**
   * Handle status command.
   * @private
   */
  status = () => {
    this.shell.exec('bower-locker status')
  }

  /**
   * Uninstall packages.
   * @private
   * @param {[String]} [packageNames] - Packages to uninstall.
   */
  uninstall = (packageNames = []) => {
    this.bowerExecute('uninstall', packageNames)
  }

  /**
   * Handle unlock command.
   * @private
   */
  unlock = () => {
    this.shell.exec('bower-locker unlock')
  }

  /**
   * Update packages.
   * @private
   * @param {[String]} [packageNames] - Packages to update.
   */
  update = (packageNames = []) => {
    this.bowerExecute('update', packageNames)
  }

  /**
   * Handle validate command.
   * @private
   */
  validate = () => {
    this.shell.exec('bower-locker validate')
  }
}
