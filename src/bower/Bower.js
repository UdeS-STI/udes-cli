import shell from 'shelljs'
import yargs from 'yargs'

/**
 * Class to handle actions related to building a polymer project.
 * @class
 * @param {Object} args - Bower arguments when not using command line.
 */
export default class Bower {
  constructor(args) {
    if (!args) {
      this.validateArgv()
    }

    this.args = this.formatArguments(args || this.argv)
    this.shell = {
      exec (arg) {
        console.log(arg)
      },
    }
  }

  /**
   * Validate CLI arguments.
   */
  validateArgv = () => {
    this.argv = yargs
      .command('bower <command>', 'Use bower tools', (yargs) => {
        yargs
          .positional('command', {
            describe: 'bower command to execute',
          })
      }, argv => {
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
  formatArguments = ({ command }) => ({ command })

  /**
   * Execute code for building polymer project.
   */
  run = () => {
    if (this[this.args.command]) {
      this[this.args.command]()
    } else {
      throw new Error('Invalid command')
    }
  }

  install = (packageName) => {
    if (packageName) {
      this.unlock()
      this.shell.exec(`bower install ${packageName}`)
      this.lock()
    } else {
      this.shell.exec('bower install')
    }
  }

  lock = () => this.shell.exec('bower-locker lock')
  status = () => this.shell.exec('bower-locker status')
  unlock = () => this.shell.exec('bower-locker unlock')
  validate = () => this.shell.exec('bower-locker validate')
}
