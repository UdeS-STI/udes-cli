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
  var _args$build = args.build,
      build = _args$build === undefined ? true : _args$build,
      _args$buildName = args.buildName,
      buildName = _args$buildName === undefined ? getDefaultBuildNames() : _args$buildName,
      _args$rewriteBuildDev = args.rewriteBuildDev,
      rewriteBuildDev = _args$rewriteBuildDev === undefined ? false : _args$rewriteBuildDev,
      rootURI = args.rootURI;


  if (rewriteBuildDev) {
    _logger.logger.debug('.htaccess Rewrite without build directory: true');
  }

  return {
    build: build,
    buildNames: Array.isArray(buildName) ? buildName : [buildName],
    devdir: rootURI.replace(/^\//, '').replace(/([^/])$/, '$&/'),
    dir: dir,
    rewriteBuildDev: rewriteBuildDev
  };
};

/**
 * Class to handle actions related to building a polymer project.
 * @class
 * @params {Object} [args] - Build arguments when not using command line.
 */

var PolymerBuild = function PolymerBuild(args) {
  var _this = this;

  _classCallCheck(this, PolymerBuild);

  this.validateArgv = function () {
    _this.argv = _yargs2.default.usage('Usage: $0 -r rootURI [--buildName name1 name2 ...] [-a addBuildDir]').option('rewriteBuildDev', {
      alias: 'r',
      describe: 'Rewrite of htaccess for build dir if true'
    }).option('buildName', {
      alias: 'b',
      describe: 'Choose a build',
      choices: ['bundled', 'unbundled', 'es5-bundled', 'es6-bundled', 'es6-unbundled'],
      type: 'array'
    }).option('rootURI', {
      alias: 'u',
      describe: 'Choose a build'
    }).array('buildName').demandOption(['rootURI'], 'Please provide -rootURI argument to work with this build').help('h').alias('h', 'help').argv;
  };

  this.handleHtaccess = function () {
    _logger.logger.log('Copy of .htaccess.sample to ' + _this.buildDir + '/.htaccess ...');
    var _args = _this.args,
        devdir = _args.devdir,
        rewriteBuildDev = _args.rewriteBuildDev;

    var sample = _fs2.default.readFileSync('htaccess.sample').toString();

    sample = sample.replace(/RewriteBase[\s]+.*/, 'RewriteBase /' + devdir + (rewriteBuildDev ? _this.buildDir : ''));

    _fs2.default.writeFileSync(_this.buildDir + '/.htaccess', sample);

    _logger.logger.log('Copy completed!');
  };

  this.modifyMetaBase = function (html) {
    var _args2 = _this.args,
        devdir = _args2.devdir,
        rewriteBuildDev = _args2.rewriteBuildDev;

    return html.replace(/base\shref="[\w/~-]*"/, 'base href="/' + devdir + (rewriteBuildDev ? _this.buildDir : '') + '"');
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

  this.handleIndexFile = function () {
    var index = _this.buildDir + '/index.html';

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

  this.renameIndexHtml = function () {
    if (_fs2.default.existsSync(_this.buildDir + '/index.html')) {
      _fs2.default.renameSync(_this.buildDir + '/index.html', _this.buildDir + '/index.html');
    }
  };

  this.handleBuild = function (buildName) {
    _this.buildDir = '' + _this.args.dir + buildName;
    _logger.logger.log('Build directory: ' + _this.buildDir);

    _this.handleIndexFile();

    if (_this.args.rewriteBuildDev) {
      // Dev environment
      _this.handleHtaccess();
    } else {
      // Production environment
      _this.removeIndexPhp();
      _this.renameIndexHtml();
    }
  };

  this.run = function () {
    if (_this.args.build) {
      _shelljs2.default.exec('polymer build');
    }

    try {
      _this.args.buildNames.forEach(_this.handleBuild);
    } catch (error) {
      _logger.logger.error(error);
      process.exit(1);
    }
  };

  if (!args) {
    this.validateArgv();
  } else if (!args.rootURI) {
    throw new Error('Please provide rootURI argument to work with this build');
  }
  this.args = formatArguments(args || this.argv);
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
 * Rename index.html file in build directory.
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