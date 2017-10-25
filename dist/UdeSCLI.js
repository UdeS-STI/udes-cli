'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _PolymerBuild = require('./polymer/PolymerBuild');

var _PolymerBuild2 = _interopRequireDefault(_PolymerBuild);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 *
 */
var UdeSCLI = function UdeSCLI() {
  var _this = this;

  _classCallCheck(this, UdeSCLI);

  this.help = function () {
    _this.argv = _yargs2.default.usage('Usage: $0 -r rootURI [--buildName name1 name2 ...] [-a addBuildDir]').command('polymer-build', 'Build a repo for release').help('h').alias('h', 'help').argv;
  };

  this.run = function (command, args) {
    var commandInstance = void 0;

    switch (command) {
      case 'polymer-build':
        commandInstance = new _PolymerBuild2.default(args);
        commandInstance.run();
        break;
      default:
        _this.help();
    }
  };
};

exports.default = UdeSCLI;