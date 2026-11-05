import { env } from './env.js';

export const databaseConfig = {
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon serverless pooler TLS
  },
  max: 10, // Serverless pooler recommended max connections per container
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  neon: {
    connectionString: env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  }
};

