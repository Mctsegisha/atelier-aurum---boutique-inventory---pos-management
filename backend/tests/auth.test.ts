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
});

