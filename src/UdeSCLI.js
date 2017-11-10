import shell from 'shelljs'
import yargs from 'yargs'
import updateNotifier from 'update-notifier'

import Bower from './bower/Bower'
import Format from './lint/Format'
import Lint from './lint/Lint'
import PolymerBuild from './polymer/PolymerBuild'
import pkg from '../package.json'

/**
 * Dispatch commands to proper class.
 * @class
 */
export default class UdeSCLI {
  constructor () {
    this.checkForUpdateAsync()
  }

  /**
   * Asynchronously check for package updates and,
   * if needed, notify on the next time the CLI is run.
   * @see {@link https://github.com/yeoman/update-notifier#how|yeoman/update-notifier} for info on how this works
   * @private
   */
  checkForUpdateAsync = () => {
    updateNotifier({ pkg }).notify({ defer: false })
  }

  /**
   * Display help information.
   */
  help = () => {
    this.argv = yargs
      .usage('Usage: udes <command> [options]')
      .command('bower', 'Execute bower and bower-locker tasks')
      .command('format', 'Format files using linting tools')
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
      case '-h':
        this.help()
        break
      case 'bower':
        commandInstance = new Bower()
        commandInstance.run()
        break
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
      default:
        shell.exec(`node ${__dirname}/../bin/udes -h`)
    }
  }
}
