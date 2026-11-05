import { db } from '../../database/connection.js';

export class SettingsRepository {
  public get() {
    return db.prepare('SELECT * FROM business_settings LIMIT 1').get() || {};
  }

  public update(body: any) {
    db.prepare(`
      UPDATE business_settings SET
        business_name = COALESCE(?, business_name),
        tagline = COALESCE(?, tagline),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        address = COALESCE(?, address),
        currency_code = COALESCE(?, currency_code),
        currency_symbol = COALESCE(?, currency_symbol),
        tax_rate = COALESCE(?, tax_rate),
        low_stock_threshold = COALESCE(?, low_stock_threshold),
        receipt_header = COALESCE(?, receipt_header),
        receipt_footer = COALESCE(?, receipt_footer),
        allow_negative_inventory = COALESCE(?, allow_negative_inventory),
        return_policy_days = COALESCE(?, return_policy_days)
      WHERE id = 'cfg_default'
    `).run(
      body.business_name || null,
      body.tagline || null,
      body.phone || null,
      body.email || null,
      body.address || null,
      body.currency_code || null,
      body.currency_symbol || null,
      body.tax_rate !== undefined ? Number(body.tax_rate) : null,
      body.low_stock_threshold !== undefined ? Number(body.low_stock_threshold) : null,
      body.receipt_header || null,
      body.receipt_footer || null,
      body.allow_negative_inventory !== undefined ? (body.allow_negative_inventory ? 1 : 0) : null,
      body.return_policy_days !== undefined ? Number(body.return_policy_days) : null
    );

    return db.prepare('SELECT * FROM business_settings LIMIT 1').get();
  }
}

export const settingsRepository = new SettingsRepository();

