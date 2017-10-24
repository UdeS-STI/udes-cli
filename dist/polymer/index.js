'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _debug = true;

var loggerType = {
  DEBUG: {
    title: '=============== DEBUG ===============\n',
    color: '\x1b[34m'
  },
  ERROR: {
    title: '=============== ERROR ===============\n',
    color: '\x1b[31m'
  },
  RESET: '\x1b[0m'
};

var getLogArguments = function getLogArguments(type) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  var argumentList = args.map(function (arg) {
    return (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object' ? arg : arg + '\n';
  });
  argumentList.unshift(loggerType[type].title);
  argumentList.unshift(loggerType[type].color);
  argumentList.push('\x1b[0m');
  return argumentList;
};

var logger = _extends({}, console, {
  debug: function debug() {
    var _console;

    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    return _debug && (_console = console).log.apply(_console, _toConsumableArray(getLogArguments.apply(undefined, ['DEBUG'].concat(args))));
  },
  error: function error() {
    var _console2;

    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    return (_console2 = console).log.apply(_console2, _toConsumableArray(getLogArguments.apply(undefined, ['ERROR'].concat(args))));
  }

  /**
   * Ensures that the directory is in a standard format.
   * @param {String} directory - A directory path.
   * @returns {String} Properly formatted directory (dir/example/).
   */
});var formatDir = function formatDir(directory) {
  var dir = directory.replace(/^\//, '').replace(/([^/])$/, '$&/');
  logger.debug('\tdir: ' + dir);
  return dir;
};

/**
 * Converts command line arguments into a usable object.
 * @param {[String]} argv - Arguments passed through command line.
 * @returns {Object} Arguments in a formatted object.
 */
var getArguments = function getArguments(argv) {
  logger.debug('argv', argv);
  var defaultArgs = {
    dir: 'build/',
    devdir: null,
    buildNames: [],
    rewriteBuildDev: false
  };

  var args = argv.reduce(function (acc, cur) {
    var _cur$split = cur.split('='),
        key = _cur$split[0],
        value = _cur$split[1];

    switch (key) {
      case '-rewriteBuildDev':
        logger.debug('.htaccess Rewrite without build directory: true');
        return _extends({}, acc, { rewriteBuildDev: true });
      case '-rootURI':
        return _extends({}, acc, { devdir: formatDir(value) });
      case '-buildName':
        return _extends({}, acc, { buildNames: value.split(',') });
      case '-buildFolder':
        return _extends({}, acc, { dir: formatDir(value) });
    }
  }, {});

  if (!args.devdir) {
    throw new Error('Undefined argument `-rootURI`');
  }

  if (!args.buildNames.length) {
    delete args.buildNames;
  }

  return _extends({}, defaultArgs, args);
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

  logger.log('Copy of .htaccess.sample to ' + buildDir + '...');
  _cpx2.default.copySync(sourceHtaccess, buildDir);

  logger.log('Rename ' + htaccessSample + ' to ' + htaccess + '...');
  _fs2.default.renameSync(htaccessSample, htaccess);

  if (!_fs2.default.existsSync(htaccess)) {
    throw new Error('Error, file ' + htaccess + ' not found');
  }

  logger.log('Rename completed!');
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

  logger.log('Replacing the RewriteBase for ' + htaccess + ' ...');
  var changedFiles = _replaceInFile2.default.sync({
    files: htaccess,
    from: /RewriteBase[\s]+.*/,
    to: 'RewriteBase /' + devdir + (rewriteBuildDev ? buildDir : '')
  });

  if (!changedFiles.length) {
    throw new Error('.htaccess not modified');
  }

  logger.log('.htaccess modified!');
};

/**
 * update meta tags in index files.
 * @param {String} buildDir - Location of build directory.
 */
var modifyMetaBaseIndex = function modifyMetaBaseIndex(buildDir) {
  var index = buildDir + '/_index.html';

  logger.log('Replace <meta base> of ' + index + '...');
  var changedFiles = _replaceInFile2.default.sync({
    files: index,
    from: /base\shref="https:\/\/www.usherbrooke.ca[\w\d\-~=+#/]*/,
    to: 'base href="/' // For local execution only.
  });

  logger.log('_index.html modified: ' + !!changedFiles.length);
};

/**
 * Update src tags in index files.
 * @param {String} buildDir - Location of build directory.
 * @throws {Error} If no files are updated.
 */
var modifyInlineIndex = function modifyInlineIndex(buildDir) {
  var index = buildDir + '/_index.html';

  logger.log('Replace <src inline=""> with <src inline> in ' + index + '...');
  var changedFiles = _replaceInFile2.default.sync({
    files: index,
    from: /inline=""/g,
    to: 'inline'
  });

  if (!changedFiles.length) {
    throw new Error('No replacement of \xAB inline="" \xBB in ' + index);
  }

  logger.log('Replace <src inline> Ok!');
};

/**
 * Minify and compress src tags in index files.
 * @param {String} buildDir - Location of build directory.
 * @throws {Error} If no file is compressed.
 */
var compressInlineIndex = function compressInlineIndex(buildDir) {
  var index = buildDir + '/_index.html';

  logger.log('Minify and compress <src inline> in ' + index + '...');
  var html = _inlineSource2.default.sync(_path2.default.resolve(index), {
    compress: true,
    rootpath: _path2.default.resolve('./')
  });

  if (!html) {
    throw new Error(index + ' not compressed');
  }

  logger.log('Minify and compress <src inline> Ok!');
};

/**
 * @param {String} -rootURI - Choose a build (eg.: -rootURI='~webv9201/nsquart2/inscription-fcnc/')
 * @param {Boolean} [-rewriteBuildDev] - If true rewrite of htaccess for build directory (eg: -rewriteBuildDev=true)
 * @param {String} [-buildFolder='build/'] - Build directory
 * @param {[String]} [-buildName=['bundled', 'unbundled']] (optional)
 * @exemple
 * node index.js -- -addBuildDir=true -rootURI='~webv9201/nsquart2/inscription-fcnc/'
 * npm run build -- -rootURI='~webv9201/nsquart2/inscription-fcnc/'
 */
try {
  var args = getArguments(process.argv);

  args.buildNames.forEach(function (buildName) {
    var buildDir = '' + args.dir + buildName;
    logger.log('Build directory: ' + buildDir);

    if (args.rewriteBuildDev) {
      copyHtaccess(buildDir);
      replaceRewriteHtaccess(buildDir, args.devdir, args.rewriteBuildDev);
    }

    modifyMetaBaseIndex(buildDir);
    modifyInlineIndex(buildDir);
    compressInlineIndex(buildDir);
  });

  process.exit(0);
} catch (error) {
  logger.error(error);
  process.exit(1);
}