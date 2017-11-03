'use strict';

require('babel-polyfill');

var _chai = require('chai');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _PolymerBuild = require('./../PolymerBuild');

var _PolymerBuild2 = _interopRequireDefault(_PolymerBuild);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-env mocha */
/* eslint no-unused-expressions: 0 */
var files = ['index.html', 'index.php', 'script.js'];
var deleteFolderRecursive = function deleteFolderRecursive(path) {
  _fs2.default.readdirSync(path).forEach(function (file) {
    var currentPath = path + '/' + file;
    if (_fs2.default.lstatSync(currentPath).isDirectory()) {
      deleteFolderRecursive(currentPath);
    } else {
      _fs2.default.unlinkSync(currentPath);
    }
  });

  _fs2.default.rmdirSync(path);
};

describe('PolymerBuild', function () {
  before(function () {
    if (!_fs2.default.existsSync('build')) {
      _fs2.default.mkdirSync('build');
      _fs2.default.mkdirSync('build/bundled');
    }

    // TODO: Use fs.copyFileSync() after updating to node 8.
    _fs2.default.writeFileSync('htaccess.sample', _fs2.default.readFileSync(__dirname + '/assets/htaccess.sample'));
  });

  beforeEach(function () {
    files.forEach(function (filename) {
      // TODO: Use fs.copyFileSync() after updating to node 8.
      _fs2.default.writeFileSync('build/bundled/' + filename, _fs2.default.readFileSync(__dirname + '/assets/' + filename));
    });
  });

  after(function () {
    deleteFolderRecursive('build');
    _fs2.default.unlinkSync('htaccess.sample');
  });

  describe('run', function () {
    it('should throw error if argument `rootURI` is missing', function () {
      var error = void 0;

      try {
        // eslint-disable-next-line no-unused-vars
        var polymerBuild = new _PolymerBuild2.default({});
      } catch (err) {
        error = err;
      }

      (0, _chai.expect)(error).to.be.not.undefined;
    });

    it('should create build for production', function () {
      var options = {
        baseURI: '/src/',
        build: false,
        buildNames: ['bundled']
      };
      var polymerBuild = new _PolymerBuild2.default(options);
      polymerBuild.run();

      var indexHtml = _fs2.default.readFileSync('build/bundled/index.html').toString();

      (0, _chai.expect)(indexHtml).to.be.equal('<!DOCTYPE html><html><head><base href="/src/" /><script>let hello="world";hello=hello.replace("world","foo");</script></head><body></body></html>\n');
      (0, _chai.expect)(_fs2.default.existsSync('build/bundled/index.php')).to.be.false;
      (0, _chai.expect)(_fs2.default.existsSync('build/bundled/script.js')).to.be.false;
      (0, _chai.expect)(_fs2.default.existsSync('build/bundled/.htaccess')).to.be.false;
    });

    it('should create build for dev', function () {
      var options = {
        addBuildDir: true,
        addBuildName: true,
        baseURI: '/src/',
        build: false,
        buildNames: ['bundled'],
        copyHtaccessSample: true
      };
      var polymerBuild = new _PolymerBuild2.default(options);
      polymerBuild.run();

      var indexHtml = _fs2.default.readFileSync('build/bundled/index.html').toString();
      var indexPhp = _fs2.default.readFileSync('build/bundled/index.php').toString();
      var htaccess = _fs2.default.readFileSync('build/bundled/.htaccess').toString();

      (0, _chai.expect)(indexHtml).to.be.equal('<!DOCTYPE html><html><head><base href="/src/build/bundled/" /><script>let hello="world";hello=hello.replace("world","foo");</script></head><body></body></html>\n');
      (0, _chai.expect)(indexPhp).to.be.equal('<?php echo "This is a PHP file"; ?>\n');
      (0, _chai.expect)(htaccess).to.be.equal('RewriteBase /src/build/bundled/\n');
      (0, _chai.expect)(_fs2.default.existsSync('build/bundled/script.js')).to.be.false;
    });
  });
});