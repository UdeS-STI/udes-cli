import yargs from 'yargs'

import Bower from './bower/Bower'
import Lint from './lint/Lint'
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
      .command('lint', 'Run linting tools for html, js and json files and for polymer projects')
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
      case 'bower':
        commandInstance = new Bower()
        commandInstance.run()
        break
      case 'polymer-build':
        commandInstance = new PolymerBuild()
        commandInstance.run()
        break
      case 'lint':
        commandInstance = new Lint()
        commandInstance.run()
        break
      default:
        this.help()
    }
  }
}
