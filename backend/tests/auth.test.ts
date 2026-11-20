import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateToken, verifyToken } from '../src/middleware/authenticate.js';

describe('Auth Service & Cryptographic Token Verification', () => {
  const dummyUser = {
    id: 'u_test_123',
    email: 'admin@hirbitstore.com',
    role: 'admin',
    username: 'admin'
  };

  it('should generate a 3-part signed JWT structure', () => {
    const token = generateToken(dummyUser);
    const parts = token.split('.');
    assert.equal(parts.length, 3, 'JWT must contain header, payload, and signature');
  });

  it('should successfully verify and decode a legitimate token', () => {
    const token = generateToken(dummyUser);
    const decoded = verifyToken(token);
    assert.equal(decoded.id, dummyUser.id);
    assert.equal(decoded.email, dummyUser.email);
    assert.equal(decoded.role, dummyUser.role);
  });

  it('should reject a tampered token signature', () => {
    const token = generateToken(dummyUser);
    const parts = token.split('.');
    // Tamper payload to escalate role to superadmin
    const tamperedPayload = Buffer.from(JSON.stringify({ ...dummyUser, role: 'superuser' })).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    assert.throws(
      () => verifyToken(tamperedToken),
      /Invalid session token signature/,
      'Tampered signature must throw an UnauthorizedError'
    );
  });

  it('should reject malformed token strings', () => {
    assert.throws(() => verifyToken('invalid-token-string'), /Malformed token structure/);
  });

  it('should support custom token expiration for persistent session (Keep Me Signed In)', () => {
    const shortToken = generateToken(dummyUser, 3600); // 1 hour
    const longToken = generateToken(dummyUser, 30 * 24 * 3600); // 30 days

    const decodedShort = verifyToken(shortToken) as any;
    const decodedLong = verifyToken(longToken) as any;

    assert.ok(decodedLong.exp > decodedShort.exp, 'Persistent token exp must be further in the future');
    assert.ok(decodedLong.exp - decodedShort.exp > 25 * 24 * 3600, 'Difference reflects extended 30-day session');
  });
});

