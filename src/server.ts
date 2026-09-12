import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Brazil Data API listening on port ${env.PORT} (${env.NODE_ENV})`);
  logger.info(`API docs available at http://localhost:${env.PORT}/api-docs`);
});

function shutdown(signal: string): void {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
