import { db } from '../../database/connection.js';

export class UsersRepository {
  public getAll() {
    return db.prepare(`
      SELECT id, username, email, full_name, role, is_active, phone, avatar_url, created_at, updated_at
      FROM profiles
      ORDER BY created_at ASC
    `).all();
  }

  public findById(id: string) {
    return db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as any;
  }

  public create(data: {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    fullName: string;
    role: string;
    phone?: string | null;
    avatarUrl?: string | null;
  }) {
    db.prepare(`
      INSERT INTO profiles (id, username, email, password_hash, full_name, role, is_active, phone, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      data.id,
      data.username.trim().toLowerCase(),
      data.email.trim().toLowerCase(),
      data.passwordHash,
      data.fullName.trim(),
      data.role,
      data.phone || null,
      data.avatarUrl || null
    );

    return db.prepare('SELECT id, username, email, full_name, role, is_active, phone FROM profiles WHERE id = ?').get(data.id);
  }

  public update(id: string, data: any) {
    db.prepare(`
      UPDATE profiles SET
        username = COALESCE(?, username),
        email = COALESCE(?, email),
        full_name = COALESCE(?, full_name),
        role = COALESCE(?, role),
        phone = COALESCE(?, phone),
        avatar_url = COALESCE(?, avatar_url),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.username ? data.username.trim().toLowerCase() : null,
      data.email ? data.email.trim().toLowerCase() : null,
      data.full_name ? data.full_name.trim() : null,
      data.role || null,
      data.phone || null,
      data.avatar_url || null,
      data.is_active !== undefined ? Number(data.is_active) : null,
      id
    );

    if (data.passwordHash) {
      db.prepare('UPDATE profiles SET password_hash = ? WHERE id = ?').run(data.passwordHash, id);
    }

    return db.prepare('SELECT id, username, email, full_name, role, is_active, phone, avatar_url FROM profiles WHERE id = ?').get(id);
  }

  public toggleActive(id: string, newStatus: number) {
    db.prepare('UPDATE profiles SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, id);
  }
}

export const usersRepository = new UsersRepository();

