import crypto from 'crypto';

/**
 * APAAR-SHIELD Identity Vault & Cryptographic Boundary
 * Enforces AES-256-GCM envelope encryption, versioned HMAC-SHA256 token matching,
 * and strict redaction rules in accordance with SECURITY_PRIVACY.md.
 */

export interface EncryptedIdentity {
  ciphertext: string;
  iv: string;
  tag: string;
  hmac: string;
  masked: string;
  keyVersion: string;
}

export class IdentityService {
  private static readonly AES_ALGORITHM = 'aes-256-gcm';
  private static readonly CURRENT_KEY_VERSION = 'V1';

  // Master key (32 bytes) - defaults to deterministic dev key if env not provided
  private readonly aesKey: Buffer;
  private readonly hmacSecret: string;

  constructor() {
    const rawAesKey =
      process.env.IDENTITY_AES_KEY_V1 ||
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    this.aesKey = Buffer.from(rawAesKey.slice(0, 64), 'hex');
    this.hmacSecret =
      process.env.IDENTITY_HMAC_KEY_V1 || 'apaar-shield-secure-hmac-secret-v1';
  }

  /**
   * Validates APAAR 12-digit numeric format
   */
  public isValidApaarFormat(apaar: string): boolean {
    if (!apaar || typeof apaar !== 'string') return false;
    const clean = apaar.trim();
    return /^\d{12}$/.test(clean);
  }

  /**
   * Masks a 12-digit APAAR for safe UI display (e.g., XXXXXXXX1234)
   */
  public maskApaar(apaar: string): string {
    if (!apaar || apaar.length < 4) return 'XXXXXXXXXXXX';
    const last4 = apaar.slice(-4);
    return `XXXXXXXX${last4}`;
  }

  /**
   * Computes a deterministic HMAC-SHA256 token using the platform's keyed secret.
   * Eliminates the risk of rainbow-table brute force attacks on the 12-digit integer space.
   */
  public computeHmac(apaar: string): string {
    const clean = (apaar || '').trim();
    return crypto
      .createHmac('sha256', this.hmacSecret)
      .update(clean)
      .digest('hex');
  }

  /**
   * Encrypts APAAR using AES-256-GCM with a fresh random 96-bit IV
   */
  public encryptApaar(apaar: string): EncryptedIdentity {
    const clean = (apaar || '').trim();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(IdentityService.AES_ALGORITHM, this.aesKey, iv);

    let ciphertext = cipher.update(clean, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');

    return {
      ciphertext,
      iv: iv.toString('hex'),
      tag,
      hmac: this.computeHmac(clean),
      masked: this.maskApaar(clean),
      keyVersion: IdentityService.CURRENT_KEY_VERSION,
    };
  }

  /**
   * Decrypts ciphertext inside the protected boundary
   */
  public decryptApaar(ciphertext: string, ivHex: string, tagHex: string): string {
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(
      IdentityService.AES_ALGORITHM,
      this.aesKey,
      iv
    );
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Redacts sensitive attributes from audit logs and error messages
   */
  public sanitizeLogPayload(payload: Record<string, any>): Record<string, any> {
    const sanitized = { ...payload };
    const sensitiveKeys = ['apaar', 'apaarReference', 'aadhaar', 'identifier_ciphertext'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.includes(key) && typeof sanitized[key] === 'string') {
        sanitized[key] = this.maskApaar(sanitized[key]);
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeLogPayload(sanitized[key]);
      }
    }
    return sanitized;
  }
}

export const identityService = new IdentityService();

