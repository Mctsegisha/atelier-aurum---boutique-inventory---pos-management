import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment files from current directory, backend root, and project root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required for Neon PostgreSQL'),
  JWT_SECRET: z.string().min(16).default('hirbit-store-secure-secret-key-2026-production'),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(604800), // 7 days
  CORS_ORIGIN: z.string().default('*'),
  DEMO_MODE: z.coerce.boolean().default(true),
  DEMO_SECRET_KEY: z.string().default('hirbit-demo-access-key-2026'),
  STORE_NAME: z.string().default('Hirbit Store'),
  STORE_ADDRESS: z.string().default('Hawassa Piyassa Mall, 1st Floor (Near Kibiru Hospital), Hawassa'),
  DEFAULT_CURRENCY: z.string().default('ETB')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[Config Error] Invalid environment configuration:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;

