import dns from 'dns';
// Resolve IPv4 first to eliminate ENETUNREACH/ETIMEDOUT on dual-stack networks
dns.setDefaultResultOrder('ipv4first');

import { createApp } from './app.js';
import { env } from './config/env.js';
import { initDatabase, db } from './database/connection.js';
import { closeNeonPool } from './database/neon.js';
import { seedDatabase } from './database/seed.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  // 1. Initialize and Seed Database
  try {
    initDatabase();
    seedDatabase();
  } catch (err) {
    logger.error('[Database Bootstrap Error]', err);
    process.exit(1);
  }

  // 2. Instantiate Application
  const app = createApp();

  // 3. Start Server
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`[Hirbit Store] Store Management Server listening on port ${env.PORT} (${env.NODE_ENV} mode)`);
  });

  // 4. Graceful Shutdown Handler
  const shutdown = (signal: string) => {
    logger.info(`[Shutdown] Received ${signal}. Closing HTTP server and database connections...`);
    server.close(async () => {
      try {
        db.close();
        await closeNeonPool().catch(() => {});
        logger.info('[Shutdown] Database connections closed. Process terminating cleanly.');
      } catch (dbErr) {
        logger.error('[Shutdown Error closing DB]', dbErr);
      }
      process.exit(0);
    });

    // Force exit if connections take too long to close
    setTimeout(() => {
      logger.error('[Shutdown] Forceful shutdown triggered after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('[Unhandled Rejection]', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('[Uncaught Exception]', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });
}

bootstrap().catch((err) => {
  logger.error('[Fatal Bootstrap Failure]', err);
  process.exit(1);
});

