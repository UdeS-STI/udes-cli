import yargs from 'yargs'

import PolymerBuild from './polymer/PolymerBuild'

/**
 * @class
 * Dispatch commands to proper class.
 * @param {String} command - The received command.
 */
export default class UdeSCLI {
  constructor (command) {
    this.command = command
  }

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
   */
  run = () => {
    let commandInstance

    switch (this.command) {
      case 'polymer-build':
        console.log('polymer-build')
        commandInstance = new PolymerBuild()
        commandInstance.run()
        break
      default:
        this.help()
    }
  }
}
