const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  // Foreground text colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Bright foreground colors
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // Badge Background colors
  bgGreen: '\x1b[42m\x1b[30m\x1b[1m',
  bgBlue: '\x1b[44m\x1b[97m\x1b[1m',
  bgYellow: '\x1b[43m\x1b[30m\x1b[1m',
  bgRed: '\x1b[41m\x1b[97m\x1b[1m',
  bgCyan: '\x1b[46m\x1b[30m\x1b[1m',
  bgMagenta: '\x1b[45m\x1b[97m\x1b[1m'
};

const getTimestamp = () => {
  const now = new Date();
  const time = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
  return `${colors.dim}${time}${colors.reset}`;
};

const logger = {
  info: (message, meta = '') => {
    console.log(`${colors.bgBlue} INFO ${colors.reset} ${getTimestamp()} ${colors.brightCyan}${message}${colors.reset}`, meta ? JSON.stringify(meta) : '');
  },
  success: (message, meta = '') => {
    console.log(`${colors.bgGreen} DONE ${colors.reset} ${getTimestamp()} ${colors.brightGreen}${message}${colors.reset}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (message, meta = '') => {
    console.warn(`${colors.bgYellow} WARN ${colors.reset} ${getTimestamp()} ${colors.brightYellow}${message}${colors.reset}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message, meta = '') => {
    console.error(`${colors.bgRed} FAIL ${colors.reset} ${getTimestamp()} ${colors.brightRed}${message}${colors.reset}`, meta ? JSON.stringify(meta) : '');
  },
  debug: (message, meta = '') => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`${colors.bgMagenta} DBUG ${colors.reset} ${getTimestamp()} ${colors.magenta}${message}${colors.reset}`, meta ? JSON.stringify(meta) : '');
    }
  },
  colors
};

module.exports = logger;
