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
    this.shell = {
      exec (arg) {
        console.log(arg)
      },
    }

    if (!this[this.args.command]) {
      throw new Error('Invalid command')
    }
  }

  /**
   * Execute bower tasks.
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
      .command('bower <command>', 'Use bower tools', (yargs) => {
        yargs
          .positional('command', {
            describe: 'bower command to execute',
          })
          .positional('package', {
            describe: 'package to install',
          })
      }, (argv) => {
        const PACKAGE_INDEX = 1
        if (argv.command === 'install' && argv._[PACKAGE_INDEX]) {
          argv.package = argv._[PACKAGE_INDEX]
        }
      })
      .usage('Usage: udes bower <command> <package>')
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
  formatArguments = args => ({
    command: args.command,
    options: this.argv ? process.argv.filter(argv => /^-/.test(argv)) : args.options || [],
    packageName: args.package,
  })

  /**
   * Handle install command.
   * @private
   * @param {String} [packageName] - Package to install.
   */
  install = (packageName) => {
    if (packageName) {
      this.installPackage(packageName)
    } else {
      this.shell.exec('bower install')
    }
  }

  /**
   * Install a new package.
   * @private
   * @param {String} packageName - Package to install.
   */
  installPackage = (packageName) => {
    this.unlock()
    this.shell.exec(`bower install ${packageName} ${this.args.options.join(' ')}`)
    this.lock()
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
   * Handle unlock command.
   * @private
   */
  unlock = () => {
    this.shell.exec('bower-locker unlock')
  }

  /**
   * Handle validate command.
   * @private
   */
  validate = () => {
    this.shell.exec('bower-locker validate')
  }
}
