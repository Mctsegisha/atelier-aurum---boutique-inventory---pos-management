import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dashboardQuerySchema } from '../src/modules/reports/reports.schemas.js';
import { reportsRepository } from '../src/modules/reports/reports.repository.js';

describe('Dashboard Query Schema & Validation', () => {
  it('should accept valid filter presets: day, week, month, today, yesterday, 7d, 30d, custom', () => {
    const validPeriods = ['day', 'week', 'month', 'today', 'yesterday', '7d', '30d', 'custom'];
    for (const p of validPeriods) {
      const parsed = dashboardQuerySchema.query.safeParse({ period: p });
      assert.ok(parsed.success, `Period '${p}' must be valid`);
      assert.equal(parsed.data.period, p);
    }
  });

  it('should default period to day when omitted', () => {
    const parsed = dashboardQuerySchema.query.safeParse({});
    assert.ok(parsed.success);
    assert.equal(parsed.data.period, 'day');
  });

  it('should accept valid YYYY-MM-DD start and end dates', () => {
    const parsed = dashboardQuerySchema.query.safeParse({
      period: 'custom',
      startDate: '2026-11-01',
      endDate: '2026-11-15'
    });
    assert.ok(parsed.success);
    assert.equal(parsed.data.startDate, '2026-11-01');
    assert.equal(parsed.data.endDate, '2026-11-15');
  });

  it('should preprocess undefined, null, or empty string date values to undefined without failing', () => {
    const parsedUndefined = dashboardQuerySchema.query.safeParse({
      period: '30d',
      startDate: 'undefined',
      endDate: 'undefined'
    });
    assert.ok(parsedUndefined.success);
    assert.equal(parsedUndefined.data.startDate, undefined);
    assert.equal(parsedUndefined.data.endDate, undefined);

    const parsedEmpty = dashboardQuerySchema.query.safeParse({
      period: '7d',
      startDate: '',
      endDate: ''
    });
    assert.ok(parsedEmpty.success);
    assert.equal(parsedEmpty.data.startDate, undefined);
    assert.equal(parsedEmpty.data.endDate, undefined);
  });

  it('should reject malformed date strings', () => {
    const parsed = dashboardQuerySchema.query.safeParse({
      period: 'custom',
      startDate: '11/01/2026'
    });
    assert.ok(!parsed.success, 'Non-YYYY-MM-DD date must be rejected');
  });

  it('should reject unrecognized periods', () => {
    const parsed = dashboardQuerySchema.query.safeParse({ period: 'century' });
    assert.ok(!parsed.success, 'Unknown period must be rejected');
  });
});

describe('Reports Repository Date Clause Builder', () => {
  it('should build proper clause for day / today', () => {
    const clauseDay = reportsRepository.buildDateClause('day');
    assert.ok(clauseDay.sql.includes('CURRENT_DATE'));
    assert.equal(clauseDay.params.length, 0);

    const clauseToday = reportsRepository.buildDateClause('today');
    assert.ok(clauseToday.sql.includes('CURRENT_DATE'));
  });

  it('should build proper clause for week / 7d', () => {
    const clauseWeek = reportsRepository.buildDateClause('week');
    assert.ok(clauseWeek.sql.includes("INTERVAL '6 days'") || clauseWeek.sql.includes("INTERVAL '7 days'"));

    const clause7d = reportsRepository.buildDateClause('7d');
    assert.ok(clause7d.sql.includes("INTERVAL '6 days'") || clause7d.sql.includes("INTERVAL '7 days'"));
  });

  it('should build proper clause for month', () => {
    const clauseMonth = reportsRepository.buildDateClause('month');
    assert.ok(clauseMonth.sql.includes('YYYY-MM'));
  });

  it('should build parameterized clause for custom start and end date boundaries', () => {
    const clause = reportsRepository.buildDateClause('custom', '2026-11-01', '2026-11-15');
    assert.ok(clause.sql.includes('>= ?') && clause.sql.includes('<= ?'));
    assert.equal(clause.params.length, 2);
    assert.equal(clause.params[0], '2026-11-01 00:00:00');
    assert.equal(clause.params[1], '2026-11-15 23:59:59');
  });

  it('should handle single start date or end date cleanly', () => {
    const startOnly = reportsRepository.buildDateClause('custom', '2026-11-01');
    assert.equal(startOnly.params[0], '2026-11-01 00:00:00');

    const endOnly = reportsRepository.buildDateClause('custom', undefined, '2026-11-15');
    assert.equal(endOnly.params[0], '2026-11-15 23:59:59');
  });
});
