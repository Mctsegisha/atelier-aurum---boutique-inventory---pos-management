import { db } from '../../database/connection.js';

export interface ProfileRecord {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'admin' | 'store_person' | 'sales';
  is_active: number;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export class AuthRepository {
  public findByCredential(credential: string): ProfileRecord | undefined {
    const term = credential.trim().toLowerCase();

    // Check direct email or username match
    let user = db.prepare(`
      SELECT * FROM profiles
      WHERE LOWER(email) = ? OR LOWER(username) = ?
      LIMIT 1
    `).get(term, term) as ProfileRecord | undefined;

    // Brand alias support: If admin@aurastore.et or aurastore domain is entered, map to corresponding staff
    if (!user) {
      if (term === 'admin@aurastore.et' || term === 'owner@aurastore.et') {
        user = db.prepare(`SELECT * FROM profiles WHERE role = 'admin' AND is_active = 1 LIMIT 1`).get() as ProfileRecord | undefined;
      } else if (term === 'manager@aurastore.et' || term === 'store@aurastore.et') {
        user = db.prepare(`SELECT * FROM profiles WHERE role = 'store_person' AND is_active = 1 LIMIT 1`).get() as ProfileRecord | undefined;
      } else if (term === 'sales@aurastore.et' || term === 'cashier@aurastore.et') {
        user = db.prepare(`SELECT * FROM profiles WHERE role = 'sales' AND is_active = 1 LIMIT 1`).get() as ProfileRecord | undefined;
      }
    }

    return user;
  }

  public findById(id: string): ProfileRecord | undefined {
    return db.prepare(`SELECT * FROM profiles WHERE id = ?`).get(id) as ProfileRecord | undefined;
  }

  public findActiveByRole(role: string): ProfileRecord | undefined {
    return db.prepare(`
      SELECT * FROM profiles WHERE role = ? AND is_active = 1 LIMIT 1
    `).get(role) as ProfileRecord | undefined;
  }

  public updatePassword(userId: string, passwordHash: string): void {
    db.prepare(`
      UPDATE profiles SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(passwordHash, userId);
  }
}

export const authRepository = new AuthRepository();

