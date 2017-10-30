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
var file = _fs2.default.readFileSync(__dirname + '/assets/_index.html').toString();
console.log(file);

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

var files = ['_index.html', 'index.php', 'script.js'];

describe('PolymerBuild', function () {
  before(function () {
    _fs2.default.mkdirSync('build');
    _fs2.default.mkdirSync('build/bundled');
  });

  beforeEach(function () {
    files.forEach(function (filename) {
      _fs2.default.writeFileSync('build/bundled/' + filename, _fs2.default.readFileSync(__dirname + '/assets/' + filename));
    });
  });

  after(function () {
    // deleteFolderRecursive('build')
  });

  describe('run', function () {
    it('should ...', function () {
      var polymerBuild = new _PolymerBuild2.default({ rootURI: '/', buildName: ['bundled'], build: false });
      polymerBuild.run();

      (0, _chai.expect)(polymerBuild).to.be.not.null;
    });
  });
});