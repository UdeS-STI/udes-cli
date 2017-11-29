import fs from 'fs'
import yargs from 'yargs'
import ShellJSNodeCLI from '@udes/shelljs-nodecli'

/**
 * Class to handle actions related to building a polymer project.
 * @class
 * @param {Object} commands - Commands to be executed.
 * @param {Function|String} commands.html - Command to be executed for html flag.
 * @param {Function|String} commands.js - Command to be executed for js flag.
 * @param {Function|String} commands.polymer - Command to be executed for polymer flag.
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
    } else if (!args.path) {
      throw Error('Missing argument `path`')
    }

    this.args = this.formatArguments(args || this.argv)
    this.commands = commands
    this.shell = ShellJSNodeCLI
  }

  /**
   * Validate CLI arguments.
   * @private
   */
  validateArgv = () => {
    const { name } = this.constructor
    this.argv = yargs
      .command(`${name.toLowerCase()} <path>`, `${name} project`, (yargs) => {
        yargs
          .positional('path', {
            describe: 'path to execute commands',
          })
      }, argv => {})
      .usage('Usage: udes lint <path> [--html] [--js] [-p]')
      .describe('If no flags are specified, all available commands will be used')
      .option('html', {
        describe: `${name} HTML files if set`,
        default: false,
      })
      .option('js', {
        describe: `${name} JavaScript and JSON files if set`,
        default: false,
      })
      .option('polymer', {
        alias: 'p',
        describe: `${name} polymer project if set`,
        default: false,
      })
      .alias('h', 'help')
      .help('h')
      .argv
  }

  /**
   * Converts command line arguments into a usable object.
   * @private
   * @param {[String]} args - Arguments passed through command line.
   * @returns {Object} Arguments in a formatted object.
   */
  formatArguments = (args) => {
    const { html, js, path, polymer } = args

    if (!html && !js && !polymer) {
      return {
        all: true,
        path,
      }
    }

    return { html, js, path, polymer }
  }

  /**
   * Format project.
   */
  run = () => {
    this.executeCommand('html', this.hasHtmlHintConfig())
    this.executeCommand('js', this.hasEslintConfig())
    this.executeCommand('polymer', this.isPolymerProject())
  }

  /**
   * Execute shell commands for specified type of files.
   * @private
   * @param {html|js|polymer} type - Type of lintable files.
   * @param {Boolean} hasConfig - True if config file exists for specified type.
   * @throws {Error} When type flag is true but config does not exist.
   */
  executeCommand = (type, hasConfig) => {
    if ((this.args.all || this.args[type]) && hasConfig) {
      const command = this.getCommand(this.commands[type])
      const exec = ShellJSNodeCLI.exec(command)
    } else if (this.args[type] && !hasConfig) {
      throw new Error(`Cannot find ${type} config file`)
    }
  }

  /**
   * Get command string based on type a data.
   * @private
   * @param {Function|String} command - String or function returning a string to be executed.
   * @returns {String} Bash command.
   */
  getCommand = command => typeof command === 'function' ? command() : command

  /**
   * Determines whether the project has an eslint config file.
   * @private
   * @returns {Boolean} true if .eslintrc.js file is found.
   */
  hasEslintConfig = () => fs.existsSync('./.eslintrc.js')

  /**
   * Determines whether the project has an HTML hint file.
   * @private
   * @returns {Boolean} true if .htmlhintrc.json file is found.
   */
  hasHtmlHintConfig = () => fs.existsSync('./.htmlhintrc.json')

  /**
   * Determines whether the project is polymer project.
   * @private
   * @returns {Boolean} true if polymer.json file is found.
   */
  isPolymerProject = () => fs.existsSync('./polymer.json')
}
