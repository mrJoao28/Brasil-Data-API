import pino, { type LoggerOptions } from 'pino';
import { env } from './env';

const baseOptions: LoggerOptions = {
  level: env.LOG_LEVEL,
  base: {
    service: 'brazil-data-api',
  },
  redact: ['req.headers.authorization'],
};

const options: LoggerOptions =
  env.NODE_ENV === 'development'
    ? {
        ...baseOptions,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }
    : baseOptions;

export const logger = pino(options);
