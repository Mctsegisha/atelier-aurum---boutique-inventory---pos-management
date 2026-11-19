import { CashSessionsRepository, cashSessionsRepository, CashSessionRow } from './cash-sessions.repository.js';
import { generateId } from '../../utils/idGenerator.js';
import { auditService } from '../audit/audit.service.js';
import { BadRequestError, NotFoundError } from '../../errors/AppError.js';
import { AuthUser } from '../../middleware/authenticate.js';
import { OpenCashSessionInput, CloseCashSessionInput } from './cash-sessions.schemas.js';

export class CashSessionsService {
  constructor(private readonly repo: CashSessionsRepository = cashSessionsRepository) {}

  public getActiveSession(): CashSessionRow | null {
    const session = this.repo.getActiveSession();
    if (!session) return null;

    const liveSales = this.repo.aggregateSalesSince(session.opened_at);
    const openingFloat = Number(session.opening_float || 0);
    const cashSales = liveSales.cash_sales;
    const telebirrSales = liveSales.telebirr_sales;
    const totalSales = liveSales.total_sales;
    const expectedCash = openingFloat + cashSales;

    return {
      ...session,
      opening_float: openingFloat,
      cash_sales: cashSales,
      telebirr_sales: telebirrSales,
      total_sales: totalSales,
      expected_cash: expectedCash
    };
  }

  public getSessionData(): { active_session: CashSessionRow | null; history: CashSessionRow[] } {
    const active = this.getActiveSession();
    const rawHistory = this.repo.getAll(50);

    const history = rawHistory.map(item => {
      if (active && item.id === active.id) {
        return active;
      }
      return {
        ...item,
        opening_float: Number(item.opening_float || 0),
        cash_sales: Number(item.cash_sales || 0),
        telebirr_sales: Number(item.telebirr_sales || 0),
        total_sales: Number(item.total_sales || 0),
        expected_cash: Number(item.expected_cash || item.opening_float || 0),
        closing_cash: item.closing_cash !== null && item.closing_cash !== undefined ? Number(item.closing_cash) : null,
        difference: item.difference !== null && item.difference !== undefined ? Number(item.difference) : null
      };
    });

    return {
      active_session: active,
      history
    };
  }

  public openSession(user: AuthUser, body: OpenCashSessionInput): CashSessionRow {
    const existing = this.repo.getActiveSession();
    if (existing) {
      throw new BadRequestError('An active cash session is already open.');
    }

    const openingFloat = Number(body.opening_float ?? 1000.0);
    const sessionId = generateId('csess');
    const openedByName = user.full_name || user.username || 'Staff';

    const created = this.repo.createSession({
      id: sessionId,
      opened_by_user_id: user.id,
      opened_by_name: openedByName,
      opening_float: openingFloat,
      notes: body.notes
    });

    auditService.log(user.id, 'OPEN_CASH_SESSION', 'CASH_SESSION', sessionId, {
      opening_float: openingFloat,
      opened_by_name: openedByName
    });

    return {
      ...created,
      opening_float: openingFloat,
      cash_sales: 0,
      telebirr_sales: 0,
      total_sales: 0,
      expected_cash: openingFloat
    };
  }

  public closeSession(sessionId: string | undefined, user: AuthUser, body: CloseCashSessionInput): CashSessionRow {
    let targetSession: CashSessionRow | undefined;

    if (!sessionId || sessionId === 'active') {
      targetSession = this.repo.getActiveSession();
    } else {
      targetSession = this.repo.getById(sessionId);
    }

    if (!targetSession) {
      throw new NotFoundError('No active cash session found to close.');
    }

    if (targetSession.status !== 'open') {
      throw new BadRequestError('This cash session is already closed.');
    }

    const liveSales = this.repo.aggregateSalesSince(targetSession.opened_at);
    const openingFloat = Number(targetSession.opening_float || 0);
    const cashSales = liveSales.cash_sales;
    const telebirrSales = liveSales.telebirr_sales;
    const totalSales = liveSales.total_sales;
    const expectedCash = openingFloat + cashSales;

    const closingCash = Number(body.closing_cash !== undefined ? body.closing_cash : (body.counted_cash ?? 0));
    const difference = closingCash - expectedCash;

    const closed = this.repo.closeSession(targetSession.id, {
      cash_sales: cashSales,
      telebirr_sales: telebirrSales,
      total_sales: totalSales,
      expected_cash: expectedCash,
      closing_cash: closingCash,
      difference,
      notes: body.notes
    });

    auditService.log(user.id, 'CLOSE_CASH_SESSION', 'CASH_SESSION', targetSession.id, {
      expected_cash: expectedCash,
      closing_cash: closingCash,
      difference,
      total_sales: totalSales
    });

    return {
      ...closed,
      opening_float: openingFloat,
      cash_sales: cashSales,
      telebirr_sales: telebirrSales,
      total_sales: totalSales,
      expected_cash: expectedCash,
      closing_cash: closingCash,
      difference
    };
  }
}

export const cashSessionsService = new CashSessionsService();
