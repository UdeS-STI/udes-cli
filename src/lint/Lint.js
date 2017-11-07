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
  const { html, js, path, polymer } = args

  if (!html && !js && !polymer) {
    return {
      html: true,
      js: true,
      path,
      polymer: true,
    }
  }

  return { html, js, path, polymer }
}

/**
 * Class to handle actions related to building a polymer project.
 * @class
 * @param {Object} [args] - Linting arguments when not using command line.
 * @param {Boolean} [html] - Lint HTML files if true.
 * @param {Boolean} [js] - Lint JS/JSON files if true.
 * @param {String} path - Path to execute commands.
 * @param {Boolean} [polymer] - Lint polymer project if true.
 */
export default class Lint {
  constructor (args) {
    if (!args) {
      this.validateArgv()
    } else if (!args.path) {
      throw new Error('Missing argument `path`')
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
      .command('lint <path>', 'Lint project', (yargs) => {
        yargs
          .positional('path', {
            describe: 'path to execute commands',
          })
      }, argv => {})
      .usage('Usage: udes lint <path> [--html] [--js] [-p]')
      .describe('If no flags are specified, all available commands will be used')
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
    const { html, js, path, polymer } = this.args

    if (html) {
      this.shell.exec(`htmlhint ${path}/*/.html --config .htmlhintrc.json`)
    }

    if (js) {
      this.shell.exec(`eslint ${path} --ext js,json --ignore-path .gitignore`)
    }

    if (polymer && this.isPolymerProject()) {
      this.shell.exec('polymer lint')
    }
  }

  isPolymerProject = () => fs.existsSync('./polymer.json')
}
