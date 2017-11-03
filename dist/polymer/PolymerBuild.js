'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _shelljs = require('shelljs');

var _shelljs2 = _interopRequireDefault(_shelljs);

var _uglifyEs = require('uglify-es');

var _uglifyEs2 = _interopRequireDefault(_uglifyEs);

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _logger = require('../lib/logger');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Get build names from polymer config file.
 * @private
 * @returns {[String]} List of build names.
 */
var getDefaultBuildNames = function getDefaultBuildNames() {
  return JSON.parse(_fs2.default.readFileSync('polymer.json')).builds.map(function (_ref) {
    var name = _ref.name,
        preset = _ref.preset;
    return name || preset;
  });
};

/**
 * Converts command line arguments into a usable object.
 * @private
 * @param {[String]} args - Arguments passed through command line.
 * @returns {Object} Arguments in a formatted object.
 */
var formatArguments = function formatArguments(args) {
  var dir = 'build/';
  var _args$addBuildDir = args.addBuildDir,
      addBuildDir = _args$addBuildDir === undefined ? false : _args$addBuildDir,
      _args$addBuildName = args.addBuildName,
      addBuildName = _args$addBuildName === undefined ? false : _args$addBuildName,
      baseURI = args.baseURI,
      _args$build = args.build,
      build = _args$build === undefined ? true : _args$build,
      _args$buildNames = args.buildNames,
      buildNames = _args$buildNames === undefined ? getDefaultBuildNames() : _args$buildNames,
      _args$copyHtaccessSam = args.copyHtaccessSample,
      copyHtaccessSample = _args$copyHtaccessSam === undefined ? false : _args$copyHtaccessSam;


  if (copyHtaccessSample) {
    _logger.logger.debug('.htaccess Rewrite without build directory: true');
  }

  return {
    addBuildDir: addBuildDir,
    addBuildName: addBuildName,
    baseURI: baseURI,
    build: build,
    buildNames: Array.isArray(buildNames) ? buildNames : [buildNames],
    copyHtaccessSample: copyHtaccessSample,
    dir: dir
  };
};

/**
 * Class to handle actions related to building a polymer project.
 * @class
 * @params {Object} [args] - Build arguments when not using command line.
 * @params {Boolean} [args.addBuildDir=false] - Append buildDir to base href and Rewritebase if true.
 * @params {String} args.baseURI - HTML base URI for href values.
 * @params {Boolean} [args.build=true] - Execute `polymer build` command before executing script if true.
 * @params {[String]} [args.buildNames=getDefaultBuildNames()] - List of build packages.
 * @params {Boolean} [args.copyHtaccessSample=false] - Copy of htaccess for build dir if true.
 */

var PolymerBuild = function PolymerBuild(args) {
  var _this = this;

  _classCallCheck(this, PolymerBuild);

  this.validateArgv = function () {
    _this.argv = _yargs2.default.usage('Usage: udes polymer-build -u /baseURI/ [-n bundled es6-unbundled ...] [-abc]').option('addBuildDir', {
      alias: 'a',
      describe: 'Append buildDir to base href and Rewritebase if true',
      default: false
    }).option('addBuildName', {
      describe: 'Append build name to base href and Rewritebase if true',
      default: false
    }).option('baseURI', {
      alias: 'u',
      describe: 'HTML base URI for href values'
    }).option('build', {
      alias: 'b',
      default: true,
      describe: 'Execute `polymer build` command before executing script if true'
    }).option('buildNames', {
      alias: 'n',
      choices: ['bundled', 'unbundled', 'es5-bundled', 'es6-bundled', 'es6-unbundled'],
      describe: 'List of build packages',
      type: 'array'
    }).option('copyHtaccessSample', {
      alias: 'c',
      default: false,
      describe: 'Copy of htaccess for build dir if true'
    }).alias('h', 'help').array('buildNames').demandOption(['baseURI'], 'Please provide -baseURI argument to work with this build').help('h').argv;
  };

  this.formatHtaccess = function () {
    var sampleFile = 'htaccess.sample';
    _logger.logger.log('Copy of ' + sampleFile + ' to ' + _this.buildDir + '.htaccess ...');

    if (!_fs2.default.existsSync(sampleFile)) {
      throw Error(sampleFile + ' file not found');
    }

    var sample = _fs2.default.readFileSync(sampleFile).toString();

    sample = sample.replace(/RewriteBase[\s]+.*/, 'RewriteBase ' + _this.baseURL);

    _fs2.default.writeFileSync(_this.buildDir + '/.htaccess', sample);

    _logger.logger.log('Copy completed!');
  };

  this.modifyMetaBase = function (html) {
    return html.replace(/base\shref="[\w/~-]*"/, 'base href="' + _this.baseURL + '"');
  };

  this.inlineJs = function (html) {
    var SOURCE_MATCH = 2;
    var getInlineTag = function getInlineTag(string) {
      return (/<script inline(="")? src="([\w/~-]+.js)"><\/script>/.exec(string)
      );
    };
    var string = html;
    var match = getInlineTag(string);

    while (match) {
      var source = match[SOURCE_MATCH];
      var code = _fs2.default.readFileSync(_this.buildDir + '/' + source).toString();

      string = string.replace(new RegExp('<script inline(="")? src="' + source + '"></script>'), '<script>' + _uglifyEs2.default.minify(code).code + '</script>');

      _fs2.default.unlinkSync(_this.buildDir + '/' + source);
      match = getInlineTag(string);
    }

    return string;
  };

  this.formatIndexHtml = function () {
    var index = _this.buildDir + '/index.html';

    if (!_fs2.default.existsSync(index)) {
      throw Error(index + ' file not found');
    }

    var html = _fs2.default.readFileSync(index).toString();
    html = _this.modifyMetaBase(html);
    html = _this.inlineJs(html);

    _fs2.default.writeFileSync(index, html);
  };

  this.removeIndexPhp = function () {
    if (_fs2.default.existsSync(_this.buildDir + '/index.php')) {
      _fs2.default.unlinkSync(_this.buildDir + '/index.php');
    }
  };

  this.getBaseURL = function (buildName) {
    var _args = _this.args,
        addBuildDir = _args.addBuildDir,
        addBuildName = _args.addBuildName,
        baseURI = _args.baseURI,
        dir = _args.dir;


    var baseURL = baseURI;

    if (addBuildDir) {
      baseURL += dir;
    }

    if (addBuildName) {
      baseURL += buildName + '/';
    }

    return baseURL;
  };

  this.updateBuildFiles = function (buildName) {
    _this.buildDir = '' + _this.args.dir + buildName + '/';
    _this.baseURL = _this.getBaseURL(buildName);
    _logger.logger.log('Build directory: ' + _this.buildDir);

    _this.formatIndexHtml();

    if (_this.args.copyHtaccessSample) {
      _this.formatHtaccess();
    } else {
      _this.removeIndexPhp();
    }
  };

  this.run = function () {
    if (_this.args.build) {
      _shelljs2.default.exec('polymer build');
    }

    try {
      _this.args.buildNames.forEach(_this.updateBuildFiles);
    } catch (error) {
      _logger.logger.error(error.toString());
    }
  };

  if (!args) {
    this.validateArgv();
  } else if (!args.baseURI) {
    throw Error('Please provide baseURI argument to work with this build');
  }

  this.args = formatArguments(args || this.argv);

  if (!/^(\/|\w+:\/{2}).+\/$/.test(this.args.baseURI)) {
    throw Error('Invalid argument baseURI. Please use `/path/to/use/` or `http://exemple.com/` format');
  }
}

/**
 * Validate CLI arguments.
 */


/**
 * Copy sample htaccess file to the build
 * directory and replace RewriteBase entry.
 */


/**
 * Replace base tag's href property.
 * @param {String} html - HTML string.
 * @returns {string} HTML with replaced base tag.
 */


/**
 * Replace script tags with inline JavaScript.
 * @param {String} html - HTML string.
 * @returns {string} HTML with replaced base tag.
 */


/**
 * Refactor index.html files.
 */


/**
 * Delete index.php file from build directory.
 */


/**
 * Return the base URL.
 * @param {String} buildName - Build name from arguments or polymer config.
 * @return {String} Base URL.
 */


/**
 * Update build files depending on environment settings.
 * @param {String} buildName - Build name from arguments or polymer config.
 */


/**
 * Execute code for building polymer project.
 */
;

exports.default = PolymerBuild;