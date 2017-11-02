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
    baseURI: baseURI,
    build: build,
    buildNames: Array.isArray(buildNames) ? buildNames : [buildNames],
    dir: dir,
    copyHtaccessSample: copyHtaccessSample
  };
};

/**
 * Class to handle actions related to building a polymer project.
 * @class
 * @params {Object} [args] - Build arguments when not using command line.
 * @params {Boolean} [args.addBuildDir = false] - Append buildDir to base href and Rewritebase if true.
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
    }).option('build', {
      alias: 'b',
      describe: 'Execute `polymer build` command before executing script if true',
      default: true
    }).option('copyHtaccessSample', {
      alias: 'c',
      describe: 'Copy of htaccess for build dir if true',
      default: false
    }).option('buildNames', {
      alias: 'n',
      describe: 'List of build packages',
      choices: ['bundled', 'unbundled', 'es5-bundled', 'es6-bundled', 'es6-unbundled'],
      type: 'array'
    }).option('baseURI', {
      alias: 'u',
      describe: 'HTML base URI for href values'
    }).array('buildNames').demandOption(['baseURI'], 'Please provide -baseURI argument to work with this build').help('h').alias('h', 'help').argv;
  };

  this.formatHtaccess = function () {
    _logger.logger.log('Copy of .htaccess.sample to ' + _this.buildDir + '/.htaccess ...');
    var sampleDir = 'htaccess.sample';
    var _args = _this.args,
        addBuildDir = _args.addBuildDir,
        baseURI = _args.baseURI;


    if (!_fs2.default.existsSync(sampleDir)) {
      throw Error('Sample htaccess file not found');
    }

    var sample = _fs2.default.readFileSync('htaccess.sample').toString();

    sample = sample.replace(/RewriteBase[\s]+.*/, 'RewriteBase ' + baseURI + (addBuildDir ? _this.buildDir : ''));

    _fs2.default.writeFileSync(_this.buildDir + '/.htaccess', sample);

    _logger.logger.log('Copy completed!');
  };

  this.modifyMetaBase = function (html) {
    var _args2 = _this.args,
        addBuildDir = _args2.addBuildDir,
        baseURI = _args2.baseURI;

    return html.replace(/base\shref="[\w/~-]*"/, 'base href="' + baseURI + (addBuildDir ? _this.buildDir : '') + '"');
  };

  this.inlineJs = function (html) {
    var getInlineTag = function getInlineTag(string) {
      return (/<script inline(="")? src="([\w/~-]+.js)"><\/script>/.exec(string)
      );
    };
    var string = html;
    var match = getInlineTag(string);

    while (match) {
      var source = match[2];
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

  this.updateBuildFiles = function (buildName) {
    _this.buildDir = '' + _this.args.dir + buildName;
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
 * Update build files depending on environment settings.
 * @param {String} buildName - Build name from arguments or polymer config.
 */


/**
 * Execute code for building polymer project.
 */
;

exports.default = PolymerBuild;