import pino, { type LoggerOptions } from 'pino';

const baseOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
};

const options: LoggerOptions =
  process.env.NODE_ENV !== 'production'
    ? {
        ...baseOptions,
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      }
    : baseOptions;

const logger = pino(options);

export {logger}

export default logger;