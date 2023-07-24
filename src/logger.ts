import { APP_NAME } from './constants';
import { IS_PRODUCTION } from './env';

interface ILogger {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
}

function noop() {}

const log = IS_PRODUCTION ? noop : console.log.bind(console, `[${APP_NAME}]`);
const error = IS_PRODUCTION
  ? noop
  : console.error.bind(console, `[${APP_NAME}]`);
const warn = IS_PRODUCTION ? noop : console.warn.bind(console, `[${APP_NAME}]`);
const info = IS_PRODUCTION ? noop : console.info.bind(console, `[${APP_NAME}]`);

export const logger: ILogger = Object.freeze({
  log,
  error,
  warn,
  info,
});

export function makeLogger(prefix: string): ILogger {
  return Object.freeze({
    log: logger.log.bind(logger, prefix),
    error: logger.error.bind(logger, prefix),
    warn: logger.warn.bind(logger, prefix),
    info: logger.info.bind(logger, prefix),
  });
}
