import { db } from './index.ts';
import { profiles } from './schema.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  fullName: string = 'Staff Member',
  role: string = 'sales'
) {
  try {
    const result = await db
      .insert(profiles)
      .values({
        id: uid,
        username: email.split('@')[0] || uid,
        email,
        passwordHash: 'FIREBASE_AUTH',
        fullName,
        role,
        isActive: 1,
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          email,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to get or create user in PostgreSQL:', error);
    throw new Error('Database user sync failed.', { cause: error });
  }
}

export async function getUsers() {
  try {
    return await db.select().from(profiles);
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
