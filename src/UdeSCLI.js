import yargs from 'yargs'

import PolymerBuild from './polymer/PolymerBuild'

/**
 * @class
 * @param {null}
 * Dispatch commands to proper class.
 */
export default class UdeSCLI {
  /**
   * Display help information.
   */
  help = () => {
    this.argv = yargs
      .usage('Usage: udes <command> [options]')
      .command('polymer-build', 'Build a repo for release')
      .help('h')
      .alias('h', 'help')
      .argv
  }

  /**
   * Dispatch command to proper class.
   * @param {String} command - The received command.
   * @param {Object} args - Received arguments.
   */
  run = (command, args) => {
    let commandInstance

    switch (command) {
      case 'polymer-build':
        commandInstance = new PolymerBuild(args)
        commandInstance.run()
        break
      default:
        this.help()
    }
  }
}
