'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _cpx = require('cpx');

var _cpx2 = _interopRequireDefault(_cpx);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _replaceInFile = require('replace-in-file');

var _replaceInFile2 = _interopRequireDefault(_replaceInFile);

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
 * Converts command line arguments into a usable object.
 * @private
 * @param {[String]} args - Arguments passed through command line.
 * @returns {Object} Arguments in a formatted object.
 */
var formatArguments = function formatArguments(args) {
  var defaultBuildNames = void 0;
  var dir = 'build/';

  try {
    var polymerConfig = JSON.parse(_fs2.default.readFileSync(dir + 'polymer.json'));
    defaultBuildNames = polymerConfig.builds.map(function (_ref) {
      var name = _ref.name,
          preset = _ref.preset;
      return name || preset;
    });
  } catch (err) {
    defaultBuildNames = ['bundled', 'unbundled', 'es5-bundled'];
  }

  var _args$build = args.build,
      build = _args$build === undefined ? true : _args$build,
      _args$buildName = args.buildName,
      buildName = _args$buildName === undefined ? defaultBuildNames : _args$buildName,
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

  this.copyHtaccess = function () {
    var sourceHtaccess = 'htaccess.sample';
    var htaccessSample = _this.buildDir + '/' + sourceHtaccess;
    var htaccess = _this.buildDir + '/.htaccess';

    if (!_fs2.default.existsSync(sourceHtaccess)) {
      throw new Error('Error, file ' + sourceHtaccess + ' not found.');
    }

    _logger.logger.log('Copy of .htaccess.sample to ' + _this.buildDir + '...');
    _cpx2.default.copySync(sourceHtaccess, _this.buildDir);

    _logger.logger.log('Rename ' + htaccessSample + ' to ' + htaccess + '...');
    _fs2.default.renameSync(htaccessSample, htaccess);

    if (!_fs2.default.existsSync(htaccess)) {
      throw new Error('Error, file ' + htaccess + ' not found');
    }

    _logger.logger.log('Rename completed!');
  };

  this.replaceRewriteHtaccess = function () {
    var _args = _this.args,
        devdir = _args.devdir,
        rewriteBuildDev = _args.rewriteBuildDev;

    var htaccess = _this.buildDir + '/.htaccess';

    _logger.logger.log('Replacing the RewriteBase for ' + htaccess + ' ...');
    var changedFiles = _replaceInFile2.default.sync({
      files: htaccess,
      from: /RewriteBase[\s]+.*/,
      to: 'RewriteBase /' + devdir + (rewriteBuildDev ? _this.buildDir : '')
    });

    if (!changedFiles.length) {
      throw new Error('.htaccess not modified');
    }

    _logger.logger.log('.htaccess modified!');
  };

  this.modifyMetaBaseIndex = function () {
    var _args2 = _this.args,
        devdir = _args2.devdir,
        rewriteBuildDev = _args2.rewriteBuildDev;

    var index = _this.buildDir + '/_index.html';

    _logger.logger.log('Replace <meta base> of ' + index + '...');
    var changedFiles = _replaceInFile2.default.sync({
      files: index,
      from: /base\shref="[\w/~-]*"/, // For local execution only.
      to: 'base href="/' + devdir + (rewriteBuildDev ? _this.buildDir : '') + '"'
    });

    _logger.logger.log('_index.html modified: ' + !!changedFiles.length);
  };

  this.modifyInlineIndex = function () {
    var index = _this.buildDir + '/_index.html';

    _logger.logger.log('Replace <src inline=""> with <src inline> in ' + index + '...');
    _replaceInFile2.default.sync({
      files: index,
      from: /inline=""/g,
      to: 'inline'
    });

    _logger.logger.log('Replace <src inline> Ok!');
  };

  this.compressInlineIndex = function () {
    var getInlineTag = function getInlineTag(html) {
      return (/<script inline src="([\w/~-]+.js)"><\/script>/.exec(html)
      );
    };
    var index = _this.buildDir + '/_index.html';

    _logger.logger.log('Minify and compress <src inline> in ' + index + '...');

    try {
      var html = _fs2.default.readFileSync(index).toString();
      var match = getInlineTag(html);

      while (match) {
        var source = match[1];
        var code = _fs2.default.readFileSync(_this.buildDir + '/' + source).toString();
        var minifiedCode = _uglifyEs2.default.minify(code).code;

        html = html.replace('<script inline src="' + source + '"></script>', '<script>' + minifiedCode + '</script>');

        _fs2.default.unlinkSync(_this.buildDir + '/' + source);
        match = getInlineTag(html);
      }

      _fs2.default.writeFileSync(index, html);
      _logger.logger.log('Minify and compress <src inline> Ok!');
    } catch (err) {
      _logger.logger.error(err);
    }
  };

  this.removeIndexPhp = function () {
    if (_fs2.default.existsSync(_this.buildDir + '/index.php')) {
      _fs2.default.unlinkSync(_this.buildDir + '/index.php');
    }
  };

  this.renameIndexHtml = function () {
    if (_fs2.default.existsSync(_this.buildDir + '/_index.html')) {
      _fs2.default.renameSync(_this.buildDir + '/_index.html', _this.buildDir + '/index.html');
    }
  };

  this.run = function () {
    if (_this.args.build) {
      _shelljs2.default.exec('polymer build');
    }

    try {
      _this.args.buildNames.forEach(function (buildName) {
        _this.buildDir = '' + _this.args.dir + buildName;
        _logger.logger.log('Build directory: ' + _this.buildDir);

        _this.modifyMetaBaseIndex();
        _this.modifyInlineIndex();
        _this.compressInlineIndex();

        if (_this.args.rewriteBuildDev) {
          // Dev environment
          _this.copyHtaccess();
          _this.replaceRewriteHtaccess();
        } else {
          // Production environment
          _this.removeIndexPhp();
          _this.renameIndexHtml();
        }
      });
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
 * Copy sample htaccess file to the build directory.
 * @throws {Error} If copy fails.
 */


/**
 * Update RewriteBase info in htaccess file.
 * @throws {Error} If fails to update htaccess file.
 */


/**
 * update meta tags in index files.
 */


/**
 * Update src tags in index files.
 */


/**
 * Minify and compress src tags in index files.
 */


/**
 * Delete index.php file from build directory.
 */


/**
 * Rename _index.html file in build directory.
 */


/**
 * Execute code for building polymer project.
 */
;

exports.default = PolymerBuild;