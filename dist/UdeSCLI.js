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
 * @class
 * Dispatch commands to proper class.
 * @param {String} command - The received command.
 */
var UdeSCLI = function UdeSCLI(command) {
  var _this = this;

  _classCallCheck(this, UdeSCLI);

  this.help = function () {
    _this.argv = _yargs2.default.usage('Usage: udes <command> [options]').command('polymer-build', 'Build a repo for release').help('h').alias('h', 'help').argv;
  };

  this.run = function () {
    var commandInstance = void 0;

    switch (_this.command) {
      case 'polymer-build':
        console.log('polymer-build');
        commandInstance = new _PolymerBuild2.default();
        commandInstance.run();
        break;
      default:
        _this.help();
    }
  };

  this.command = command;
}

/**
 * Display help information.
 */


/**
 * Dispatch command to proper class.
 */
;

exports.default = UdeSCLI;