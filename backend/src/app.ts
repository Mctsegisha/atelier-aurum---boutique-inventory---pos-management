import express, { Express } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import { securityHeaders, corsMiddleware } from './middleware/security.js';
import { generalRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './errors/AppError.js';

// Domain Routers
import authRouter from './modules/auth/auth.routes.js';
import posRouter from './modules/pos/pos.routes.js';
import productsRouter from './modules/products/products.routes.js';
import inventoryRouter from './modules/inventory/inventory.routes.js';
import salesRouter from './modules/sales/sales.routes.js';
import customersRouter from './modules/customers/customers.routes.js';
import suppliersRouter from './modules/suppliers/suppliers.routes.js';
import expensesRouter from './modules/expenses/expenses.routes.js';
import reportsRouter from './modules/reports/reports.routes.js';
import usersRouter from './modules/users/users.routes.js';
import settingsRouter from './modules/settings/settings.routes.js';
import shiftsRouter from './modules/shifts/shifts.routes.js';
import auditRouter from './modules/audit/audit.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(): Express {
  const app = express();

  // 1. Security & Pre-processing Middlewares
  app.use(securityHeaders);
  app.use(corsMiddleware);

  // 2. Request Parsers with defensive payload limits
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // 3. General Rate Limiter
  app.use('/api', generalRateLimiter);

  // 4. Health Check Endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      store: 'Hirbit Store',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  });

  // 5. Domain REST API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/pos', posRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/inventory', inventoryRouter);
  app.use('/api/sales', salesRouter);
  app.use('/api/customers', customersRouter);
  app.use('/api/suppliers', suppliersRouter);
  app.use('/api/expenses', expensesRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/shifts', shiftsRouter);
  app.use('/api/audit', auditRouter);

  // 6. Production Static Assets Serving (SPA Support)
  const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
  const localDistPath = path.resolve(__dirname, '../dist');
  const activeDistPath = fs.existsSync(frontendDistPath)
    ? frontendDistPath
    : fs.existsSync(localDistPath)
    ? localDistPath
    : null;

  if (env.NODE_ENV === 'production' && activeDistPath) {
    app.use(express.static(activeDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(activeDistPath, 'index.html'));
    });
  }

  // 7. 404 Handler for Unmatched API Endpoints
  app.use('/api/*', (req, res, next) => {
    next(new NotFoundError(`API endpoint not found: ${req.method} ${req.originalUrl}`));
  });

  // 8. Centralized Global Error Handler
  app.use(errorHandler);

  return app;
}

