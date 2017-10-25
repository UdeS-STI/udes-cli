'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _cpx = require('cpx');

var _cpx2 = _interopRequireDefault(_cpx);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _inlineSource = require('inline-source');

var _inlineSource2 = _interopRequireDefault(_inlineSource);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _replaceInFile = require('replace-in-file');

var _replaceInFile2 = _interopRequireDefault(_replaceInFile);

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _utils = require('../lib/utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Ensures that the directory is in a standard format.
 * @param {String} dir - A directory path.
 * @returns {String} Properly formatted directory (dir/example/).
 */
var formatDir = function formatDir(dir) {
  return dir.replace(/^\//, '').replace(/([^/])$/, '$&/');
};

/**
 * Converts command line arguments into a usable object.
 * @param {[String]} args - Arguments passed through command line.
 * @returns {Object} Arguments in a formatted object.
 */
var formatArguments = function formatArguments(args) {
  if (!args.rootURI) {
    throw new Error('Undefined argument `-rootURI`');
  }

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

  var _args$buildName = args.buildName,
      buildName = _args$buildName === undefined ? defaultBuildNames : _args$buildName,
      rewriteBuildDev = args.rewriteBuildDev,
      rootURI = args.rootURI;


  if (rewriteBuildDev) {
    _utils.logger.debug('.htaccess Rewrite without build directory: true');
  }

  return {
    buildNames: Array.isArray(buildName) ? buildName : [buildName],
    devdir: formatDir(rootURI),
    dir: dir,
    rewriteBuildDev: rewriteBuildDev
  };
};

/**
 * @param {String} -rootURI - Choose a build (eg.: -rootURI='~webv9201/nsquart2/inscription-fcnc/')
 * @param {Boolean} [-rewriteBuildDev] - If true rewrite of htaccess for build directory (eg: -rewriteBuildDev=true)
 * @param {[String]} [-buildName=['bundled', 'unbundled']] (optional)
 * @example
 * node PolymerBuild.js -- -addBuildDir=true -rootURI='~webv9201/nsquart2/inscription-fcnc/'
 * npm run build -- -rootURI='~webv9201/nsquart2/inscription-fcnc/'
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
    var htaccessSample = _this.args.buildDir + '/' + sourceHtaccess;
    var htaccess = _this.args.buildDir + '/.htaccess';

    if (!_fs2.default.existsSync(sourceHtaccess)) {
      throw new Error('Error, file ' + sourceHtaccess + ' not found.');
    }

    _utils.logger.log('Copy of .htaccess.sample to ' + _this.args.buildDir + '...');
    _cpx2.default.copySync(sourceHtaccess, _this.args.buildDir);

    _utils.logger.log('Rename ' + htaccessSample + ' to ' + htaccess + '...');
    _fs2.default.renameSync(htaccessSample, htaccess);

    if (!_fs2.default.existsSync(htaccess)) {
      throw new Error('Error, file ' + htaccess + ' not found');
    }

    _utils.logger.log('Rename completed!');
  };

  this.replaceRewriteHtaccess = function () {
    var _args = _this.args,
        buildDir = _args.buildDir,
        devdir = _args.devdir,
        rewriteBuildDev = _args.rewriteBuildDev;

    var htaccess = buildDir + '/.htaccess';
    var to = rewriteBuildDev ? 'RewriteBase /' + devdir + buildDir : 'RewriteBase /' + devdir;

    _utils.logger.log('Replacing the RewriteBase for ' + htaccess + ' ...');
    var changedFiles = _replaceInFile2.default.sync({
      files: htaccess,
      from: /RewriteBase[\s]+.*/,
      to: to
    });

    if (!changedFiles.length) {
      throw new Error('.htaccess not modified');
    }

    _utils.logger.log('.htaccess modified!');
  };

  this.modifyMetaBaseIndex = function () {
    var index = _this.args.buildDir + '/_index.html';

    _utils.logger.log('Replace <meta base> of ' + index + '...');
    var changedFiles = _replaceInFile2.default.sync({
      files: index,
      from: /base\shref="(.*)"/, // For local execution only.
      to: 'base href="https://www.usherbrooke.ca/' + _this.args.devdir + '"'
    });

    _utils.logger.log('_index.html modified: ' + !!changedFiles.length);
  };

  this.modifyInlineIndex = function () {
    var index = _this.args.buildDir + '/_index.html';

    _utils.logger.log('Replace <src inline=""> with <src inline> in ' + index + '...');
    _replaceInFile2.default.sync({
      files: index,
      from: /inline=""/g,
      to: 'inline'
    });

    _utils.logger.log('Replace <src inline> Ok!');
  };

  this.compressInlineIndex = function () {
    var index = _this.args.buildDir + '/_index.html';

    _utils.logger.log('Minify and compress <src inline> in ' + index + '...');
    var html = _inlineSource2.default.sync(_path2.default.resolve(index), {
      compress: true,
      rootpath: _path2.default.resolve('./')
    });

    if (!html) {
      throw new Error(index + ' not compressed');
    }

    _utils.logger.log('Minify and compress <src inline> Ok!');
  };

  this.run = function () {
    try {
      _this.args.buildNames.forEach(function (buildName) {
        _this.buildDir = '' + _this.args.dir + buildName;
        _utils.logger.log('Build directory: ' + _this.buildDir);

        _this.copyHtaccess();
        _this.replaceRewriteHtaccess();
        _this.modifyMetaBaseIndex();
        _this.modifyInlineIndex();
        _this.compressInlineIndex();
      });

      process.exit(0);
    } catch (error) {
      _utils.logger.error(error);
      process.exit(1);
    }
  };

  this.validateArgv();
  this.args = formatArguments(args);
}

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
 * @throws {Error} If no file is compressed.
 */
;

exports.default = PolymerBuild;