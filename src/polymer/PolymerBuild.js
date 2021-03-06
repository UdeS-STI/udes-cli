import fs from 'fs';
import ShellJSNodeCLI from '@udes/shelljs-nodecli';
import yargs from 'yargs';
import { udesLogger as logger } from 'udes-logger';

/**
 * Get build names from polymer config file.
 * @private
 * @returns {[String]} List of build names.
 */
const getDefaultBuildNames = () =>
  JSON.parse(fs.readFileSync('polymer.json')).builds.map(({ name, preset }) => name || preset);

/**
 * Converts command line arguments into a usable object.
 * @private
 * @param {[String]} args - Arguments passed through command line.
 * @returns {Object} Arguments in a formatted object.
 */
const formatArguments = (args) => {
  const dir = 'build/';
  const {
    addBuildDir = false,
    addBuildName = false,
    baseURI,
    build = true,
    buildNames = getDefaultBuildNames(),
    copyHtaccessSample = false,
  } = args;

  if (copyHtaccessSample) {
    logger.debug('.htaccess Rewrite without build directory: true');
  }

  return {
    addBuildDir,
    addBuildName,
    baseURI,
    build,
    buildNames: (Array.isArray(buildNames)) ? buildNames : [buildNames],
    copyHtaccessSample,
    dir,
  };
};

/**
 * Class to handle actions related to building a polymer project.
 * @class
 * @param {Object} args - Build arguments when not using command line.
 * @param {Boolean} [args.addBuildDir=false] - Append buildDir to base href and Rewritebase if true.
 * @param {Boolean} [args.addBuildName=false] - Append build name to base href and Rewritebase if true.
 * @param {String} args.baseURI - HTML base URI for href values.
 * @param {Boolean} [args.build=true] - Execute `polymer build` command before executing script if true.
 * @param {[String]} [args.buildNames=getDefaultBuildNames()] - List of build packages.
 * @param {Boolean} [args.copyHtaccessSample=false] - Copy of htaccess for build dir if true.
 */
export default class PolymerBuild {
  constructor(args) {
    if (!args) {
      this.validateArgv();
    } else if (!args.baseURI) {
      throw Error('Please provide baseURI argument to work with this build');
    }

    this.args = formatArguments(args || this.argv);

    if (!this.__isValidBaseURI(this.args.baseURI)) {
      throw Error(
        `Invalid argument baseURI (${this.args.baseURI}). Please use '/path/to/use/' or 'http://exemple.com/' format`
      );
    }
  }

  /**
   * Return true if the baseURI is valid.
   * @private
   * @param {String} baseURI - Base URI.
   * @return {Boolean} True if the baseURI is valid.
   */
  __isValidBaseURI(baseURI) {
    return (/^((\/|\w+:\/{2}).+)?\/$/.test(baseURI));
  }

  /**
   * Validate CLI arguments.
   */
  validateArgv = () => {
    this.argv = yargs
      .usage('Usage: udes polymer-build -u /baseURI/ [-n bundled es6-unbundled ...] [-abc]')
      .option('addBuildDir', {
        alias: 'a',
        describe: 'Append buildDir to base href and Rewritebase if true',
        default: false,
      })
      .option('addBuildName', {
        describe: 'Append build name to base href and Rewritebase if true',
        default: false,
      })
      .option('baseURI', {
        alias: 'u',
        describe: 'HTML base URI for href values',
      })
      .option('build', {
        alias: 'b',
        default: true,
        describe: 'Execute `polymer build` command before executing script if true',
      })
      .option('buildNames', {
        alias: 'n',
        choices: ['bundled', 'unbundled', 'es5-bundled', 'es6-bundled', 'es6-unbundled'],
        describe: 'List of build packages',
        type: 'array',
      })
      .option('copyHtaccessSample', {
        alias: 'c',
        default: false,
        describe: 'Copy of htaccess for build dir if true',
      })
      .alias('h', 'help')
      .array('buildNames')
      .demandOption(['baseURI'], 'Please provide -baseURI argument to work with this build')
      .help('h')
      .argv;
  }

  /**
   * Copy sample htaccess file to the build
   * directory and replace RewriteBase entry.
   */
  formatHtaccess = () => {
    const sampleFile = 'htaccess.sample';
    logger.info(`Copy of ${sampleFile} to ${this.buildDir}.htaccess ...`);

    if (!fs.existsSync(sampleFile)) {
      throw Error(`${sampleFile} file not found`);
    }

    let sample = fs.readFileSync(sampleFile).toString();

    sample = sample.replace(
      /RewriteBase[\s]+.*/,
      `RewriteBase ${this.baseURL}`
    );

    fs.writeFileSync(`${this.buildDir}/.htaccess`, sample);

    logger.info('Copy completed!');
  }

  /**
   * Replace base tag's href property.
   * @param {String} html - HTML string.
   * @returns {string} HTML with replaced base tag.
   */
  modifyMetaBase = html => html.replace(
    /base\shref="[\w/~-]*"/,
    `base href="${this.baseURL}"`
  )

  /**
   * Refactor index.html files.
   */
  formatIndexHtml = () => {
    const index = `${this.buildDir}/index.html`;

    if (!fs.existsSync(index)) {
      throw Error(`${index} file not found`);
    }

    let html = fs.readFileSync(index).toString();
    html = this.modifyMetaBase(html);

    fs.writeFileSync(index, html);
  }

  /**
   * Delete index.php file from build directory.
   */
  removeIndexPhp = () => {
    if (fs.existsSync(`${this.buildDir}/index.php`)) {
      fs.unlinkSync(`${this.buildDir}/index.php`);
    }
  }

  /**
   * Return the base URL.
   * @param {String} buildName - Build name from arguments or polymer config.
   * @return {String} Base URL.
   */
  getBaseURL = (buildName) => {
    const {
      addBuildDir,
      addBuildName,
      baseURI,
      dir,
    } = this.args;

    return `${baseURI}${addBuildDir ? dir : ''}${addBuildName ? `${buildName}/` : ''}`;
  }

  /**
   * Update build files depending on environment settings.
   * @param {String} buildName - Build name from arguments or polymer config.
   */
  updateBuildFiles = (buildName) => {
    this.baseURL = this.getBaseURL(buildName);
    this.buildDir = `${this.args.dir}${buildName}/`;

    logger.info(`Build directory: ${this.buildDir}`);

    this.formatIndexHtml();

    if (this.args.copyHtaccessSample) {
      this.formatHtaccess();
    } else {
      this.removeIndexPhp();
    }
  }

  /**
   * Execute code for building polymer project.
   */
  run = () => {
    if (this.args.build) {
      ShellJSNodeCLI.exec('polymer build');
    }

    try {
      this.args.buildNames.forEach(this.updateBuildFiles);
    } catch (error) {
      logger.error(error.toString());
    }
  }
}
