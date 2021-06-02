import fancyLog from 'fancy-log';
import logger from 'gulplog';

/**
 * Taken from: https://github.com/gulpjs/gulp-cli/blob/master/lib/shared/log/to-console.js
 */
const levels = [
    'error', // -L: Logs error events.
    'warn', // -LL: Logs warn and error events.
    'info', // -LLL: Logs info, warn and error events.
    'debug', // -LLLL: Logs all log levels.
];

const cleanup = (log): void => {
    levels.forEach(removeListeners);

    function removeListeners(level) {
        if (level === 'error') {
            log.removeListener(level, fancyLog.error);
        } else {
            log.removeListener(level, fancyLog);
        }
    }
};

const toConsole = (log, logLevel = 3) => {
    cleanup(log);

    levels
        .filter(function (item, i) {
            return i < logLevel;
        })
        .forEach(function (level) {
            if (level === 'error') {
                log.on(level, fancyLog.error);
            } else {
                log.on(level, fancyLog);
            }
        });
};

export const initLogger = (logLevel = 3): any => {
    toConsole(logger, logLevel);

    return logger;
};
