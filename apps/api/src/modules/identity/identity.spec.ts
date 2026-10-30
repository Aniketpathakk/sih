import { describe, it } from 'node:test';
import assert from 'node:assert';
import { IdentityService } from './identity.service';

describe('Identity Vault Cryptography & Privacy Tests', () => {
  const service = new IdentityService();

  it('T01: Validates 12-digit format correctly', () => {
    assert.strictEqual(service.isValidApaarFormat('900000000001'), true);
    assert.strictEqual(service.isValidApaarFormat('90000000001'), false); // 11 digits
    assert.strictEqual(service.isValidApaarFormat('9000000000019'), false); // 13 digits
    assert.strictEqual(service.isValidApaarFormat('90000000000A'), false); // alphanumeric
    assert.strictEqual(service.isValidApaarFormat(''), false);
  });

  it('T02: Masks APAAR identifier safely', () => {
    const masked = service.maskApaar('900000001234');
    assert.strictEqual(masked, 'XXXXXXXX1234');
    assert.strictEqual(masked.includes('90000000'), false);
  });

  it('T03: Computes deterministic HMAC tokens without collisions', () => {
    const apaar1 = '900000000001';
    const apaar2 = '900000000002';

    const hmac1a = service.computeHmac(apaar1);
    const hmac1b = service.computeHmac(apaar1);
    const hmac2 = service.computeHmac(apaar2);

    assert.strictEqual(hmac1a, hmac1b); // deterministic
    assert.notStrictEqual(hmac1a, hmac2);
    assert.strictEqual(typeof hmac1a, 'string');
    assert.strictEqual(hmac1a.length, 64); // SHA-256 hex length
  });

  it('T04: AES-256-GCM envelope encryption and decryption roundtrip', () => {
    const rawApaar = '987654321098';
    const encrypted = service.encryptApaar(rawApaar);

    assert.notStrictEqual(encrypted.ciphertext, rawApaar);
    assert.strictEqual(encrypted.masked, 'XXXXXXXX1098');
    assert.strictEqual(encrypted.keyVersion, 'V1');

    const decrypted = service.decryptApaar(
      encrypted.ciphertext,
      encrypted.iv,
      encrypted.tag
    );
    assert.strictEqual(decrypted, rawApaar);
  });

  it('T05: Sanitizes sensitive log payload', () => {
    const payload = {
      action: 'BATCH_UPLOAD',
      apaarReference: '900000005555',
      nested: {
        apaar: '900000006666',
      },
    };

    const sanitized = service.sanitizeLogPayload(payload);
    assert.strictEqual(sanitized.apaarReference, 'XXXXXXXX5555');
    assert.strictEqual(sanitized.nested.apaar, 'XXXXXXXX6666');
  });
});

