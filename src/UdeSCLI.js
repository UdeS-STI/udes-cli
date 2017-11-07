import yargs from 'yargs'

import Format from './lint/Format'
import Lint from './lint/Lint'
import PolymerBuild from './polymer/PolymerBuild'
import Publish from './publish/Publish'

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
      .command('format', 'Format files using linting tools')
      .command('lint', 'Run linting tools for html, js and json files and for polymer projects')
      .command('polymer-build', 'Build a polymer repo for release')
      .command('publish', 'Publish an npm package')
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
      case 'format':
        commandInstance = new Format()
        commandInstance.run()
        break
      case 'lint':
        commandInstance = new Lint()
        commandInstance.run()
        break
      case 'polymer-build':
        commandInstance = new PolymerBuild()
        commandInstance.run()
        break
      case 'publish':
        commandInstance = new Publish()
        commandInstance.run()
        break
      default:
        this.help()
    }
  }
}
