import yargs from 'yargs'

import PolymerBuild from './polymer/PolymerBuild'

/**
 * Dispatch commands to proper class.
 * @class
 */
export default class UdeSCLI {
  /**
   * Display help information.
   */
  help = () => {
    this.argv = yargs
      .usage('Usage: udes <command> [options]')
      .command('polymer-build', 'Build a polymer repo for release')
      .help('h')
      .alias('h', 'help')
      .argv
  }

  /**
   * Dispatch command to proper class.
   * @param {String} command - The received command.
   */
  run = (command) => {
    let commandInstance

    switch (command) {
      case 'polymer-build':
        commandInstance = new PolymerBuild()
        commandInstance.run()
        break
      default:
        this.help()
    }
  }
}