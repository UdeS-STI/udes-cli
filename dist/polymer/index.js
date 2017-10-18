'use strict';

var _cpx = require('cpx');

var _cpx2 = _interopRequireDefault(_cpx);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _replaceInFile = require('replace-in-file');

var _replaceInFile2 = _interopRequireDefault(_replaceInFile);

var _inlineSource = require('inline-source');

var _inlineSource2 = _interopRequireDefault(_inlineSource);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utils = require('../lib/utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Ensures that the directory is in a standard format.
 * @param {String} directory - A directory path.
 * @returns {String} Properly formatted directory (dir/example/).
 */
var formatDir = function formatDir(directory) {
  var dir = directory.replace(/^\//, '').replace(/([^/])$/, '$&/');
  _utils.logger.debug('\tdir: ' + dir);
  return dir;
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

  var _args$buildFolder = args.buildFolder,
      buildFolder = _args$buildFolder === undefined ? 'build/' : _args$buildFolder,
      _args$buildName = args.buildName,
      buildName = _args$buildName === undefined ? ['bundled', 'unbundled', 'es5-bundled'] : _args$buildName,
      rootURI = args.rootURI,
      rewriteBuildDev = args.rewriteBuildDev;


  return {
    dir: formatDir(buildFolder),
    devdir: formatDir(rootURI),
    rewriteBuildDev: rewriteBuildDev,
    buildNames: buildName
  };
};

/**
 * Copy sample htaccess file to the build directory.
 * @param {String} buildDir - Location of build directory.
 * @throws {Error} If copy fails.
 */
var copyHtaccess = function copyHtaccess(buildDir) {
  var sourceHtaccess = 'htaccess.sample';
  var htaccessSample = buildDir + '/' + sourceHtaccess;
  var htaccess = buildDir + '/.htaccess';

  if (!_fs2.default.existsSync(sourceHtaccess)) {
    throw new Error('Error, file ' + sourceHtaccess + ' not found.');
  }

  _utils.logger.log('Copy of .htaccess.sample to ' + buildDir + '...');
  _cpx2.default.copySync(sourceHtaccess, buildDir);

  _utils.logger.log('Rename ' + htaccessSample + ' to ' + htaccess + '...');
  _fs2.default.renameSync(htaccessSample, htaccess);

  if (!_fs2.default.existsSync(htaccess)) {
    throw new Error('Error, file ' + htaccess + ' not found');
  }

  _utils.logger.log('Rename completed!');
};

/**
 * Update RewriteBase info in htaccess file.
 * @param {String} buildDir - Location of build directory.
 * @param {Object} args - Command line arguments.
 * @param {String} args.devdir -Build directory
 * @param {Boolean} args.rewriteBuildDev - If true rewrite of htaccess for build directory
 * @throws {Error} If fails to update htaccess file.
 */
var replaceRewriteHtaccess = function replaceRewriteHtaccess(buildDir, _ref) {
  var devdir = _ref.devdir,
      rewriteBuildDev = _ref.rewriteBuildDev;

  var htaccess = buildDir + '/.htaccess';

  _utils.logger.log('Replacing the RewriteBase for ' + htaccess + ' ...');
  var changedFiles = _replaceInFile2.default.sync({
    files: htaccess,
    from: /RewriteBase[\s]+.*/,
    to: 'RewriteBase /' + devdir + (rewriteBuildDev ? buildDir : '')
  });

  if (!changedFiles.length) {
    throw new Error('.htaccess not modified');
  }

  _utils.logger.log('.htaccess modified!');
};

/**
 * update meta tags in index files.
 * @param {String} buildDir - Location of build directory.
 */
var modifyMetaBaseIndex = function modifyMetaBaseIndex(buildDir) {
  var index = buildDir + '/_index.html';

  _utils.logger.log('Replace <meta base> of ' + index + '...');
  var changedFiles = _replaceInFile2.default.sync({
    files: index,
    from: /base\shref="https:\/\/www.usherbrooke.ca[\w\d\-~=+#/]*/,
    to: 'base href="/' // For local execution only.
  });

  _utils.logger.log('_index.html modified: ' + !!changedFiles.length);
};

/**
 * Update src tags in index files.
 * @param {String} buildDir - Location of build directory.
 * @throws {Error} If no files are updated.
 */
var modifyInlineIndex = function modifyInlineIndex(buildDir) {
  var index = buildDir + '/_index.html';

  _utils.logger.log('Replace <src inline=""> with <src inline> in ' + index + '...');
  var changedFiles = _replaceInFile2.default.sync({
    files: index,
    from: /inline=""/g,
    to: 'inline'
  });

  if (!changedFiles.length) {
    throw new Error('No replacement of \xAB inline="" \xBB in ' + index);
  }

  _utils.logger.log('Replace <src inline> Ok!');
};

/**
 * Minify and compress src tags in index files.
 * @param {String} buildDir - Location of build directory.
 * @throws {Error} If no file is compressed.
 */
var compressInlineIndex = function compressInlineIndex(buildDir) {
  var index = buildDir + '/_index.html';

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

/**
 * @param {String} -rootURI - Choose a build (eg.: -rootURI='~webv9201/nsquart2/inscription-fcnc/')
 * @param {Boolean} [-rewriteBuildDev] - If true rewrite of htaccess for build directory (eg: -rewriteBuildDev=true)
 * @param {String} [-buildFolder='build/'] - Build directory
 * @param {[String]} [-buildName=['bundled', 'unbundled']] (optional)
 * @example
 * node index.js -- -addBuildDir=true -rootURI='~webv9201/nsquart2/inscription-fcnc/'
 * npm run build -- -rootURI='~webv9201/nsquart2/inscription-fcnc/'
 */
try {
  var args = formatArguments((0, _utils.getArguments)());

  args.buildNames.forEach(function (buildName) {
    var buildDir = '' + args.dir + buildName;
    _utils.logger.log('Build directory: ' + buildDir);

    copyHtaccess(buildDir);
    replaceRewriteHtaccess(buildDir, args);
    modifyMetaBaseIndex(buildDir);
    modifyInlineIndex(buildDir);
    compressInlineIndex(buildDir);
  });

  process.exit(0);
} catch (error) {
  _utils.logger.error(error);
  process.exit(1);
}