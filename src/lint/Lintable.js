import fs from 'fs'
import shell from 'shelljs'
import yargs from 'yargs'

/**
 * Converts command line arguments into a usable object.
 * @private
 * @param {[String]} args - Arguments passed through command line.
 * @returns {Object} Arguments in a formatted object.
 */
const formatArguments = (args) => {
  const { dir = '.', html, js, polymer } = args

  if (!html && !js && !polymer) {
    return {
      dir,
      html: true,
      js: true,
      polymer: true,
    }
  }

  return { dir, html, js, polymer }
}

/**
 * Class to handle actions related to building a polymer project.
 * @class
 * @param {Object} commands - Commands to be executed.
 * @param {String} commands.html - Command to be executed for html flag.
 * @param {String} commands.js - Command to be executed for js flag.
 * @param {String} commands.polymer - Command to be executed for polymer flag.
 * @param {Object} [args] - Linting arguments when not using command line.
 * @param {String} [dir] - Base directory to execute commands.
 * @param {Boolean} [html] - Format HTML files if true.
 * @param {Boolean} [js] - Format JS/JSON files if true.
 * @param {Boolean} [polymer] - Format polymer project if true.
 */
export default class Lintable {
  constructor (commands, args) {
    if (!args) {
      this.validateArgv()
    }

    this.commands = commands
    this.args = formatArguments(args || this.argv)
    this.shell = shell
  }

  /**
   * Validate CLI arguments.
   * @private
   */
  validateArgv = () => {
    console.log(this.constructor.name)
    this.argv = yargs
      .usage('Usage: udes lint [-d] [--html] [--js] [-p]')
      .describe('If no flags are specified, all available commands will be used')
      .option('html', {
        describe: 'Format HTML files if set',
        default: false,
      })
      .option('js', {
        describe: 'Format JavaScript and JSON files if set',
        default: false,
      })
      .option('polymer', {
        alias: 'p',
        describe: 'Use polymer lint if set',
        default: false,
      })
      .option('dir', {
        alias: 'd',
        describe: 'Base directory to execute commands',
      })
      .alias('h', 'help')
      .help('h')
      .argv
  }

  /**
   * Format project.
   */
  run = () => {
    const { html, js, polymer } = this.args

    if (html) {
      this.shell.exec(this.commands.html)
    }

    if (js) {
      this.shell.exec(this.commands.js)
    }

    if (polymer && this.isPolymerProject()) {
      this.shell.exec(this.commands.polymer)
    }
  }

  isPolymerProject = () => fs.existsSync('./polymer.json')
}
