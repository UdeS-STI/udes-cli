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
 * @param {Object} [args] - Linting arguments when not using command line.
 * @param {String} [dir] - Base directory to execute commands.
 * @param {Boolean} [html] - Lint HTML files if true.
 * @param {Boolean} [js] - Lint JS/JSON files if true.
 * @param {Boolean} [polymer] - Lint polymer project if true.
 */
export default class Lint {
  constructor (args) {
    if (!args) {
      this.validateArgv()
    }

    this.args = formatArguments(args || this.argv)
    this.shell = shell
  }

  /**
   * Validate CLI arguments.
   * @private
   */
  validateArgv = () => {
    this.argv = yargs
      .usage('Usage: udes lint [-d] [--html] [--js] [-p]')
      .describe('If no flags are specified, all available commands will be used')
      .option('dir', {
        alias: 'd',
        describe: 'Base directory to execute commands',
      })
      .option('html', {
        describe: 'Lint HTML files if set',
        default: false,
      })
      .option('js', {
        describe: 'Lint JavaScript and JSON files if set',
        default: false,
      })
      .option('polymer', {
        alias: 'p',
        describe: 'Use polymer lint if set',
        default: false,
      })
      .alias('h', 'help')
      .help('h')
      .argv
  }

  /**
   * Lint project.
   */
  run = () => {
    const { dir, html, js, polymer } = this.args

    if (html) {
      this.shell.exec(`htmlhint ${dir}/*/.html --config .htmlhintrc.json`)
    }

    if (js) {
      this.shell.exec(`eslint ${dir} --ext js,json --ignore-path .gitignore`)
    }

    if (polymer && this.isPolymerProject()) {
      this.shell.exec('polymer lint')
    }
  }

  isPolymerProject = () => fs.existsSync('./polymer.json')
}
