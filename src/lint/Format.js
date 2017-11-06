import Lintable from './Lintable'

/**
 * Class to handle actions related to building a polymer project.
 * @class
 * @param {Object} [args] - Linting arguments when not using command line.
 * @param {String} [dir] - Base directory to execute commands.
 * @param {Boolean} [html] - Format HTML files if true.
 * @param {Boolean} [js] - Format JS/JSON files if true.
 * @param {Boolean} [polymer] - Format polymer project if true.
 */
export default class Format extends Lintable {
  constructor (args) {
    super({
      html: () => `eslint ${this.args.path} --ext html --ignore-path .gitignore --fix`,
      js: () => `eslint ${this.args.path} --ext js,json --ignore-path .gitignore --fix`,
      polymer: 'polymer lint --fix',
    }, args)
  }
}
