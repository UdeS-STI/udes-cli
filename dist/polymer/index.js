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
 * @param {String} devdir -Build directory
 * @throws {Error} If fails to update htaccess file.
 */
var replaceRewriteHtaccess = function replaceRewriteHtaccess(buildDir, devdir, rewriteBuildDev) {
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

/**
 * update meta tags in index files.
 * @param {String} buildDir - Location of build directory.
 */
var modifyMetaBaseIndex = function modifyMetaBaseIndex(buildDir, devdir) {
  var index = buildDir + '/_index.html';

  _utils.logger.log('Replace <meta base> of ' + index + '...');
  var changedFiles = _replaceInFile2.default.sync({
    files: index,
    from: /base\shref="\/"/, // For local execution only.
    to: 'https://www.usherbrooke.ca/' + devdir
  });

  _utils.logger.log('_index.html modified: ' + !!changedFiles.length);
};

/**
 * Update src tags in index files.
 * @param {String} buildDir - Location of build directory.
 */
var modifyInlineIndex = function modifyInlineIndex(buildDir) {
  var index = buildDir + '/_index.html';

  _utils.logger.log('Replace <src inline=""> with <src inline> in ' + index + '...');
  _replaceInFile2.default.sync({
    files: index,
    from: /inline=""/g,
    to: 'inline'
  });

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
 * @param {[String]} [-buildName=['bundled', 'unbundled']] (optional)
 * @example
 * node index.js -- -addBuildDir=true -rootURI='~webv9201/nsquart2/inscription-fcnc/'
 * npm run build -- -rootURI='~webv9201/nsquart2/inscription-fcnc/'
 */
try {
  var _formatArguments = formatArguments((0, _utils.getArguments)()),
      buildNames = _formatArguments.buildNames,
      devdir = _formatArguments.devdir,
      dir = _formatArguments.dir,
      rewriteBuildDev = _formatArguments.rewriteBuildDev;

  buildNames.forEach(function (buildName) {
    var buildDir = '' + dir + buildName;
    _utils.logger.log('Build directory: ' + buildDir);

    copyHtaccess(buildDir);
    replaceRewriteHtaccess(buildDir, devdir, rewriteBuildDev);
    modifyMetaBaseIndex(buildDir, devdir);
    modifyInlineIndex(buildDir);
    compressInlineIndex(buildDir);
  });

  process.exit(0);
} catch (error) {
  _utils.logger.error(error);
  process.exit(1);
}