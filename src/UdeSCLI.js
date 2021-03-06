import yargs from 'yargs';
import updateNotifier from 'update-notifier';

import Bower from './bower/Bower';
import PolymerBuild from './polymer/PolymerBuild';
import pkg from '../package.json';

/**
 * Dispatch commands to proper class.
 * @class
 */
export default class UdeSCLI {
  constructor() {
    this.checkForUpdateAsync();
  }

  /**
   * Asynchronously check for package updates and,
   * if needed, notify on the next time the CLI is run.
   * @see {@link https://github.com/yeoman/update-notifier#how|yeoman/update-notifier} for info on how this works
   * @private
   */
  checkForUpdateAsync = () => {
    updateNotifier({ pkg }).notify({ defer: false });
  }

  /**
   * Display help information.
   */
  help = () => {
    this.argv = yargs
      .usage('Usage: udes <command> [options]')
      .command('bower', 'Execute bower and bower-locker tasks')
      .command('polymer-build', 'Build a polymer repo for release')
      .help('h')
      .alias('h', 'help')
      .demandCommand()
      .argv;
  }

  /**
   * Dispatch command to proper class.
   * @param {String} command - The received command.
   */
  run = (command) => {
    let commandInstance;

    switch (command) {
      case 'bower':
        commandInstance = new Bower();
        commandInstance.run();
        break;
      case 'polymer-build':
        commandInstance = new PolymerBuild();
        commandInstance.run();
        break;
      default:
        this.help();
    }
  }
}
