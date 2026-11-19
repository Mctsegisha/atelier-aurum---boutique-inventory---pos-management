import { test, describe } from 'node:test';
import assert from 'node:assert';
import { openCashSessionSchema, closeCashSessionSchema } from '../src/modules/cash-sessions/cash-sessions.schemas.js';
import { CashSessionsService } from '../src/modules/cash-sessions/cash-sessions.service.js';
import { CashSessionsRepository, CashSessionRow } from '../src/modules/cash-sessions/cash-sessions.repository.js';
import { AuthUser } from '../src/middleware/authenticate.js';

describe('Cash Sessions Validation Schemas', () => {
  test('should accept valid open session payload with default opening float', () => {
    const parsed = openCashSessionSchema.body.parse({});
    assert.strictEqual(parsed.opening_float, 1000.0);
  });

  test('should accept valid open session payload with custom opening float and notes', () => {
    const parsed = openCashSessionSchema.body.parse({
      opening_float: 2500.5,
      notes: 'Morning drawer float'
    });
    assert.strictEqual(parsed.opening_float, 2500.5);
    assert.strictEqual(parsed.notes, 'Morning drawer float');
  });

  test('should reject negative opening float', () => {
    assert.throws(() => {
      openCashSessionSchema.body.parse({ opening_float: -100 });
    });
  });

  test('should accept valid close session payload with counted_cash', () => {
    const parsed = closeCashSessionSchema.body.parse({
      counted_cash: 1000.0,
      notes: 'Even drawer'
    });
    assert.strictEqual(parsed.counted_cash, 1000.0);
  });

  test('should accept valid close session payload with closing_cash', () => {
    const parsed = closeCashSessionSchema.body.parse({
      closing_cash: 1250.0
    });
    assert.strictEqual(parsed.closing_cash, 1250.0);
  });

  test('should reject close session payload when neither closing_cash nor counted_cash is provided', () => {
    assert.throws(() => {
      closeCashSessionSchema.body.parse({ notes: 'missing cash count' });
    });
  });
});

describe('Cash Sessions Business Logic & Calculation', () => {
  const dummyUser: AuthUser = {
    id: 'u_test_visitor',
    username: 'demovisitor',
    email: 'visitor@hirbit.com',
    full_name: 'Demo Visitor',
    role: 'admin'
  };

  test('should return null when no session is active', () => {
    let storedSession: CashSessionRow | undefined = undefined;

    const mockRepo = {
      getActiveSession: () => storedSession,
      aggregateSalesSince: () => ({ cash_sales: 0, telebirr_sales: 0, total_sales: 0 }),
      getAll: () => [],
      getById: (id: string) => storedSession?.id === id ? storedSession : undefined,
      createSession: (data: any) => {
        storedSession = {
          ...data,
          opened_at: new Date().toISOString(),
          cash_sales: 0,
          telebirr_sales: 0,
          total_sales: 0,
          expected_cash: data.opening_float,
          status: 'open'
        };
        return storedSession!;
      },
      closeSession: () => { throw new Error('Not implemented'); }
    } as unknown as CashSessionsRepository;

    const service = new CashSessionsService(mockRepo);
    const active = service.getActiveSession();
    assert.strictEqual(active, null);
  });

  test('should open a new cash session with correct default float and opened_by_name', () => {
    let storedSession: CashSessionRow | undefined = undefined;

    const mockRepo = {
      getActiveSession: () => storedSession,
      aggregateSalesSince: () => ({ cash_sales: 0, telebirr_sales: 0, total_sales: 0 }),
      getAll: () => storedSession ? [storedSession] : [],
      getById: (id: string) => storedSession?.id === id ? storedSession : undefined,
      createSession: (data: any) => {
        storedSession = {
          ...data,
          opened_at: new Date().toISOString(),
          cash_sales: 0,
          telebirr_sales: 0,
          total_sales: 0,
          expected_cash: data.opening_float,
          status: 'open'
        };
        return storedSession!;
      },
      closeSession: () => { throw new Error('Not implemented'); }
    } as unknown as CashSessionsRepository;

    const service = new CashSessionsService(mockRepo);
    const created = service.openSession(dummyUser, { opening_float: 1000.0, notes: 'Drawer open' });

    assert.strictEqual(created.opening_float, 1000.0);
    assert.strictEqual(created.opened_by_name, 'Demo Visitor');
    assert.strictEqual(created.status, 'open');
    assert.strictEqual(created.expected_cash, 1000.0);
  });

  test('should prevent opening another session when an active session already exists', () => {
    let storedSession: CashSessionRow | undefined = {
      id: 'csess_existing',
      opened_by_user_id: 'u_1',
      opened_by_name: 'Demo Visitor',
      opened_at: new Date().toISOString(),
      opening_float: 1000.0,
      cash_sales: 0,
      telebirr_sales: 0,
      total_sales: 0,
      expected_cash: 1000.0,
      status: 'open'
    };

    const mockRepo = {
      getActiveSession: () => storedSession,
      aggregateSalesSince: () => ({ cash_sales: 0, telebirr_sales: 0, total_sales: 0 }),
      getAll: () => [storedSession!],
      getById: (id: string) => storedSession?.id === id ? storedSession : undefined,
      createSession: () => { throw new Error('Should not be called'); },
      closeSession: () => { throw new Error('Not implemented'); }
    } as unknown as CashSessionsRepository;

    const service = new CashSessionsService(mockRepo);
    assert.throws(() => {
      service.openSession(dummyUser, { opening_float: 1000.0 });
    }, /already open/);
  });

  test('should accurately calculate live sales aggregations: expected_cash = opening_float + cash_sales', () => {
    const sessionRow: CashSessionRow = {
      id: 'csess_active_1',
      opened_by_user_id: 'u_1',
      opened_by_name: 'Demo Visitor',
      opened_at: '2026-11-19T10:00:00Z',
      opening_float: 1000.0,
      cash_sales: 0,
      telebirr_sales: 0,
      total_sales: 0,
      expected_cash: 1000.0,
      status: 'open'
    };

    const mockRepo = {
      getActiveSession: () => sessionRow,
      aggregateSalesSince: () => ({
        cash_sales: 500.0,
        telebirr_sales: 350.0,
        total_sales: 850.0
      }),
      getAll: () => [sessionRow],
      getById: (id: string) => id === sessionRow.id ? sessionRow : undefined,
      createSession: () => { throw new Error('Not implemented'); },
      closeSession: () => { throw new Error('Not implemented'); }
    } as unknown as CashSessionsRepository;

    const service = new CashSessionsService(mockRepo);
    const enriched = service.getActiveSession();

    assert.ok(enriched);
    assert.strictEqual(enriched.opening_float, 1000.0);
    assert.strictEqual(enriched.cash_sales, 500.0);
    assert.strictEqual(enriched.telebirr_sales, 350.0);
    assert.strictEqual(enriched.total_sales, 850.0);
    // Crucial rule: Telebirr never enters drawer, so expected_cash = opening_float + cash_sales
    assert.strictEqual(enriched.expected_cash, 1500.0);
  });

  test('should accurately compute difference on closing: difference = closing_cash - expected_cash', () => {
    let sessionRow: CashSessionRow = {
      id: 'csess_to_close',
      opened_by_user_id: 'u_1',
      opened_by_name: 'Demo Visitor',
      opened_at: '2026-11-19T10:00:00Z',
      opening_float: 1000.0,
      cash_sales: 0,
      telebirr_sales: 0,
      total_sales: 0,
      expected_cash: 1000.0,
      status: 'open'
    };

    const mockRepo = {
      getActiveSession: () => sessionRow.status === 'open' ? sessionRow : undefined,
      aggregateSalesSince: () => ({
        cash_sales: 424.0,
        telebirr_sales: 595.0,
        total_sales: 1019.0
      }),
      getAll: () => [sessionRow],
      getById: (id: string) => id === sessionRow.id ? sessionRow : undefined,
      createSession: () => { throw new Error('Not implemented'); },
      closeSession: (id: string, updateData: any) => {
        sessionRow = {
          ...sessionRow,
          ...updateData,
          status: 'closed',
          closed_at: new Date().toISOString()
        };
        return sessionRow;
      }
    } as unknown as CashSessionsRepository;

    const service = new CashSessionsService(mockRepo);
    // Expected cash = 1000 + 424 = 1424. Counted cash = 1419. Short by 5 (-5.00)
    const closed = service.closeSession('csess_to_close', dummyUser, {
      counted_cash: 1419.0,
      notes: 'Small shortage'
    });

    assert.strictEqual(closed.status, 'closed');
    assert.strictEqual(closed.expected_cash, 1424.0);
    assert.strictEqual(closed.closing_cash, 1419.0);
    assert.strictEqual(closed.difference, -5.0);
  });
});
