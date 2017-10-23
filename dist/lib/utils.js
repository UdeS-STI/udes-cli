'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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

var logger = exports.logger = _extends({}, console, {
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
   * Converts the arguments array into a readable object.
   * @returns {Object} An object containing the command line arguments.
   */
});var getArguments = exports.getArguments = function getArguments() {
  return process.argv.reduce(function (acc, arg) {
    if (arg.includes('=') || /^-+\w+/.test(arg)) {
      var _arg$split = arg.split('='),
          key = _arg$split[0],
          value = _arg$split[1];

      return value === 'undefined' ? acc : _extends({}, acc, _defineProperty({}, key.replace(/^-+/, ''), value || true));
    }

    return acc;
  }, {});
};