const debug = true
const loggerType = {
  DEBUG: {
    title: '=============== DEBUG ===============\n',
    color: '\x1b[34m',
  },
  ERROR: {
    title: '=============== ERROR ===============\n',
    color: '\x1b[31m',
  },
  RESET: '\x1b[0m',
}
const getLogArguments = (type, ...args) => {
  const argumentList = args.map(arg => typeof arg === 'object' ? arg : `${arg}\n`)
  argumentList.unshift(loggerType[type].title)
  argumentList.unshift(loggerType[type].color)
  argumentList.push('\x1b[0m')
  return argumentList
}

export const logger = {
  ...console,
  debug: (...args) => debug && console.log(...getLogArguments('DEBUG', ...args)),
  error: (...args) => console.log(...getLogArguments('ERROR', ...args)),
}

/**
 * Converts the arguments array into a readable object.
 * @returns {Object} An object containing the command line arguments.
 */
export const getArguments = () => process.argv.slice(3).reduce((acc, arg) => {
  if (arg.includes('=') || /^-+\w+/.test(arg)) {
    const { 0: key, 1: value } = arg.split('=')
    return value === 'undefined' ? acc : {
      ...acc,
      [key.replace(/^-+/, '')]: value || true,
    }
  }

  return acc
}, {})
