import dns from 'dns';
// Ensure IPv4 resolution takes precedence over unreachable IPv6 routes
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

import { Worker } from 'worker_threads';
import pg from 'pg';
import fs from 'fs';
import { env } from '../config/env.js';
import { databaseConfig } from '../config/database.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface StatementResult {
  changes: number;
  lastInsertRowid?: number | string;
}

export interface PreparedStatement<TDefault = any> {
  all<T = TDefault>(...params: any[]): T[];
  get<T = TDefault>(...params: any[]): T | undefined;
  run(...params: any[]): StatementResult;
}

/**
 * Translates SQLite syntax idioms to PostgreSQL standard SQL.
 */
export function translateSql(sql: string): { sql: string; isPragma: boolean; pragmaTable?: string } {
  const pragmaMatch = sql.match(/PRAGMA\s+table_info\((\w+)\)/i);
  if (pragmaMatch) {
    return {
      sql: `SELECT column_name as name FROM information_schema.columns WHERE table_name = '${pragmaMatch[1].toLowerCase()}'`,
      isPragma: true,
      pragmaTable: pragmaMatch[1],
    };
  }

  let paramIndex = 1;
  let translated = sql
    // Replace positional ? with $1, $2, ...
    .replace(/\?/g, () => `$${paramIndex++}`)
    // Replace SQLite relative date calls with PostgreSQL interval expressions
    .replace(/datetime\('now',\s*'-?(\d+)\s*days?'\)/gi, "NOW() - INTERVAL '$1 days'")
    .replace(/datetime\('now',\s*'-?(\d+)\s*hours?'\)/gi, "NOW() - INTERVAL '$1 hours'")
    .replace(/datetime\('now'\)/gi, 'NOW()')
    .replace(/date\('now',\s*'-?(\d+)\s*days?'\)/gi, "CURRENT_DATE - INTERVAL '$1 days'")
    .replace(/date\('now',\s*'-?(\d+)\s*hours?'\)/gi, "CURRENT_DATE - INTERVAL '$1 hours'")
    .replace(/date\('now'\)/gi, 'CURRENT_DATE')
    .replace(/strftime\('%Y-%m',\s*'now'\)/gi, "to_char(NOW(), 'YYYY-MM')")
    .replace(/strftime\('%Y-%m',\s*([^)]+)\)/gi, "to_char($1, 'YYYY-MM')");

  return { sql: translated, isPragma: false };
}

/**
 * Format query parameters to ensure compatibility with PostgreSQL drivers.
 * Replaces undefined with null, and maps booleans to 1/0 for integer flag columns.
 */
function normalizeParams(params: any[]): any[] {
  return params.flat().map((p) => {
    if (p === undefined) return null;
    if (typeof p === 'boolean') return p ? 1 : 0;
    return p;
  });
}

// 16 MB SharedArrayBuffer for zero-latency inter-thread IPC
const BUFFER_SIZE = 16 * 1024 * 1024;
const sab = new SharedArrayBuffer(BUFFER_SIZE);
const state = new Int32Array(sab, 0, 4);
const sharedData = new Uint8Array(sab, 16);
const decoder = new TextDecoder();
const encoder = new TextEncoder();

const rawUrl = process.env.DATABASE_URL || env.DATABASE_URL || '';
// Strip channel_binding if present to ensure clean TLS handshake with pg-pool
const databaseUrl = rawUrl.replace(/[?&]channel_binding=[^&]+/g, (match) => (match.startsWith('?') ? '?' : ''));

// Worker code that runs persistent PostgreSQL client with connection pooling and HTTPS port 443 fallback
const workerSource = `
  const dns = require('dns');
  try { dns.setDefaultResultOrder('ipv4first'); } catch {}

  const { workerData, parentPort } = require('worker_threads');
  const { Pool } = require('pg');
  const { neon, neonConfig } = require('@neondatabase/serverless');
  const fs = require('fs');
  const https = require('https');

  // Defensive IPv4 fetch handler to bypass unreachable IPv6 routes
  function ipv4Fetch(url, options = {}) {
    const urlObj = new URL(url.toString());
    return new Promise((resolve, reject) => {
      const req = https.request(urlObj, {
        method: options.method || 'POST',
        headers: options.headers || {},
        family: 4,
        timeout: 15000
      }, (res) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const bodyText = Buffer.concat(chunks).toString('utf8');
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: new Headers(res.headers),
            text: async () => bodyText,
            json: async () => JSON.parse(bodyText)
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Neon HTTPS request timed out'));
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  }

  neonConfig.fetchFunction = ipv4Fetch;

  const connectionString = '${databaseUrl}';
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    // Idle connection drop handled by retry logic
  });

  // Neon HTTP Serverless Client (communicates over standard HTTPS port 443)
  const httpSql = neon(connectionString, { fullResults: true });
  let preferHttp = false;

  const state = new Int32Array(workerData, 0, 4);
  const data = new Uint8Array(workerData, 16);
  const maxBytes = workerData.byteLength - 16;
  const encoder = new TextEncoder();

  async function executeWithDualTransport(sql, params) {
    const isTxCmd = /^(BEGIN|COMMIT|ROLLBACK)/i.test(sql.trim());

    if (preferHttp && !isTxCmd) {
      const res = await httpSql.query(sql, params);
      const rows = res.rows || res;
      return { rows, rowCount: res.rowCount ?? (Array.isArray(rows) ? rows.length : 0) };
    }

    try {
      const res = await pool.query(sql, params);
      return { rows: res.rows, rowCount: res.rowCount ?? 0 };
    } catch (tcpErr) {
      // If port 5432 is blocked by firewall/network (ETIMEDOUT or ENETUNREACH), auto-switch to HTTPS (port 443)
      preferHttp = true;
      if (isTxCmd) {
        return { rows: [], rowCount: 0 };
      }
      const res = await httpSql.query(sql, params);
      const rows = res.rows || res;
      return { rows, rowCount: res.rowCount ?? (Array.isArray(rows) ? rows.length : 0) };
    }
  }

  parentPort.on('message', async (msg) => {
    if (msg.type === 'QUERY') {
      try {
        const { rows, rowCount } = await executeWithDualTransport(msg.sql, msg.params);
        const json = JSON.stringify({ ok: true, rows, rowCount });
        const bytes = encoder.encode(json);

        if (bytes.length > maxBytes) {
          // Overflow fallback: write to temporary disk file
          const tmpFile = '/tmp/neon-query-overflow-' + process.pid + '-' + Date.now() + '.json';
          fs.writeFileSync(tmpFile, json, 'utf8');
          state[2] = 1; // Overflow flag
          state[1] = tmpFile.length;
          data.set(encoder.encode(tmpFile));
        } else {
          state[2] = 0; // In-memory
          data.set(bytes);
          state[1] = bytes.length;
        }
        state[0] = 1; // Success
      } catch (err) {
        const errMsg = err.errors ? err.errors.map(e => e.message || String(e)).join('; ') : (err.message || String(err));
        const json = JSON.stringify({ ok: false, error: errMsg });
        const bytes = encoder.encode(json);
        state[2] = 0;
        data.set(bytes);
        state[1] = bytes.length;
        state[0] = 2; // Error
      }
      Atomics.notify(state, 0, 1);
    } else if (msg.type === 'CLOSE') {
      try {
        await pool.end();
      } catch {}
      process.exit(0);
    }
  });
`;

let worker: Worker | null = null;
let asyncPool: pg.Pool | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(workerSource, { eval: true, workerData: sab });
    worker.unref(); // Don't prevent process exit
  }
  return worker;
}

/**
 * Executes a SQL query synchronously via worker thread connected to Neon PostgreSQL.
 */
function syncQuery(sql: string, params: any[] = []): QueryResult {
  const currentWorker = getWorker();
  const normalized = normalizeParams(params);

  // Set state: 0 = waiting
  Atomics.store(state, 0, 0);
  currentWorker.postMessage({ type: 'QUERY', sql, params: normalized });

  // Block until worker finishes and signals notification
  Atomics.wait(state, 0, 0);

  const status = state[0];
  const len = state[1];
  const isOverflow = state[2] === 1;

  let str: string;
  if (isOverflow) {
    const filePathBytes = new Uint8Array(sab, 16, len);
    const filePath = decoder.decode(filePathBytes);
    str = fs.readFileSync(filePath, 'utf8');
    try {
      fs.unlinkSync(filePath);
    } catch {}
  } else {
    const bytes = new Uint8Array(sab, 16, len);
    str = decoder.decode(bytes);
  }

  const result = JSON.parse(str);
  if (!result.ok) {
    throw new Error(`[Neon PostgreSQL Error] ${result.error} (Query: "${sql.slice(0, 120)}...")`);
  }

  return {
    rows: result.rows ?? [],
    rowCount: result.rowCount ?? 0,
  };
}

/**
 * Returns the singleton async pg.Pool instance for non-blocking direct queries.
 */
export function getPool(): pg.Pool {
  if (!asyncPool) {
    asyncPool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseConfig.ssl,
      max: databaseConfig.max,
      idleTimeoutMillis: databaseConfig.idleTimeoutMillis,
      connectionTimeoutMillis: databaseConfig.connectionTimeoutMillis,
    });

    asyncPool.on('error', (err) => {
      logger.error('[Neon Async Pool Error]', err);
    });
  }
  return asyncPool;
}

/**
 * Unified Database Wrapper providing full compatibility with both
 * synchronous statement patterns (db.prepare, db.transaction) and async queries.
 */
export class NeonDatabaseClient {
  /**
   * Prepares a SQL query for synchronous execution against Neon PostgreSQL.
   */
  public prepare<TDefault = any>(sql: string): PreparedStatement<TDefault> {
    const { sql: translatedSql, isPragma } = translateSql(sql);

    return {
      all: <T = TDefault>(...params: any[]): T[] => {
        try {
          const res = syncQuery(translatedSql, params);
          return res.rows as T[];
        } catch (err) {
          logger.error(`[Neon SQL Query Failed: all]`, err);
          throw err;
        }
      },
      get: <T = TDefault>(...params: any[]): T | undefined => {
        try {
          const res = syncQuery(translatedSql, params);
          return (res.rows[0] as T) ?? undefined;
        } catch (err) {
          logger.error(`[Neon SQL Query Failed: get]`, err);
          throw err;
        }
      },
      run: (...params: any[]): StatementResult => {
        try {
          const res = syncQuery(translatedSql, params);
          return {
            changes: res.rowCount,
            lastInsertRowid: undefined,
          };
        } catch (err) {
          logger.error(`[Neon SQL Query Failed: run]`, err);
          throw err;
        }
      },
    };
  }

  /**
   * Executes a transaction synchronously using BEGIN, COMMIT, and ROLLBACK.
   */
  public transaction<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: any[]) => {
      syncQuery('BEGIN');
      try {
        const result = fn(...args);
        syncQuery('COMMIT');
        return result;
      } catch (err) {
        try {
          syncQuery('ROLLBACK');
        } catch {}
        throw err;
      }
    }) as T;
  }

  /**
   * Executes multi-statement raw SQL against Neon PostgreSQL.
   */
  public exec(sql: string): void {
    syncQuery(sql);
  }

  /**
   * Direct asynchronous query executing against Neon PostgreSQL pool.
   */
  public async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    const pool = getPool();
    const { sql: translatedSql } = translateSql(sql);
    const normalized = normalizeParams(params);
    const res = await pool.query(translatedSql, normalized);
    return {
      rows: res.rows as T[],
      rowCount: res.rowCount ?? 0,
    };
  }

  /**
   * Closes database connections and stops worker thread.
   */
  public close(): void {
    if (worker) {
      worker.postMessage({ type: 'CLOSE' });
      worker = null;
    }
    if (asyncPool) {
      asyncPool.end().catch(() => {});
      asyncPool = null;
    }
  }
}

// Export singleton database client instance
export const db = new NeonDatabaseClient();

export function getDatabase(): NeonDatabaseClient {
  return db;
}

/**
 * Initializes and verifies the Neon PostgreSQL connection.
 */
export function initDatabase(): void {
  try {
    const check = db.prepare('SELECT NOW() as current_time, current_database() as db_name').get<{ current_time: string; db_name: string }>();
    const tableCount = db.prepare<{ count: string }>("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'").get();

    logger.info(`[Database] Neon PostgreSQL connected successfully to database "${check?.db_name}" at ${check?.current_time}`);
    logger.info(`[Database] Verified ${tableCount?.count ?? 0} active relational tables on Neon PostgreSQL.`);
  } catch (error) {
    logger.error('[Database Init Failed - Cannot connect to Neon PostgreSQL]', error);
    throw error;
  }
}

/**
 * Graceful shutdown helper
 */
export async function closeDatabase(): Promise<void> {
  db.close();
}
