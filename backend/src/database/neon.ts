import pg from 'pg';
import { databaseConfig } from '../config/database.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

let neonPoolInstance: pg.Pool | null = null;

/**
 * Returns a singleton connection pool configured for Neon PostgreSQL.
 * Optimized for Neon serverless pooler endpoints with SSL enforcement.
 */
export function getNeonPool(): pg.Pool | null {
  if (!databaseConfig.neon.connectionString) {
    return null;
  }

  if (!neonPoolInstance) {
    neonPoolInstance = new Pool({
      connectionString: databaseConfig.neon.connectionString,
      ssl: databaseConfig.neon.ssl,
      max: databaseConfig.neon.max,
      idleTimeoutMillis: databaseConfig.neon.idleTimeoutMillis,
      connectionTimeoutMillis: databaseConfig.neon.connectionTimeoutMillis,
    });

    neonPoolInstance.on('error', (err) => {
      logger.error('[Neon Pool Error] Unexpected idle client error:', err);
    });

    logger.info('[Database] Neon PostgreSQL connection pool initialized with serverless pooling & SSL.');
  }

  return neonPoolInstance;
}

/**
 * Health check helper to verify Neon PostgreSQL connectivity.
 */
export async function checkNeonConnection(): Promise<boolean> {
  const pool = getNeonPool();
  if (!pool) return false;

  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT NOW() as current_time, current_database() as db_name');
      logger.info(`[Neon Healthcheck] Connected to database "${res.rows[0]?.db_name}" at ${res.rows[0]?.current_time}`);
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error('[Neon Healthcheck Failed]', err);
    return false;
  }
}

/**
 * Graceful shutdown hook for Neon PostgreSQL connection pool.
 */
export async function closeNeonPool(): Promise<void> {
  if (neonPoolInstance) {
    await neonPoolInstance.end();
    neonPoolInstance = null;
    logger.info('[Database] Neon PostgreSQL pool closed cleanly.');
  }
}

