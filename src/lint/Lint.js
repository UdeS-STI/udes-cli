import Lintable from './Lintable'

/**
 * Class to handle actions related to building a polymer project.
 * @class
 * @param {Object} [args] - Linting arguments when not using command line.
 * @param {Boolean} [html] - Lint HTML files if true.
 * @param {Boolean} [js] - Lint JS/JSON files if true.
 * @param {String} path - Path to execute commands.
 * @param {Boolean} [polymer] - Lint polymer project if true.
 */
export default class Lint extends Lintable {
  constructor (args) {
    super({
      html: () => `htmlhint ${this.args.path}/*/.html --config .htmlhintrc.json`,
      js: () => `eslint ${this.args.path} --ext js,json --ignore-path .gitignore`,
      polymer: 'polymer lint',
    }, args)
  }
}
