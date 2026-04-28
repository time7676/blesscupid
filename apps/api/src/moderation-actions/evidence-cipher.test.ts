import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import { decryptEvidence, encryptEvidence } from './evidence-cipher.js';

describe('evidence-cipher (BLE-63 / A.2)', () => {
  const original = process.env.MODERATION_EVIDENCE_KEK;

  beforeEach(() => {
    process.env.MODERATION_EVIDENCE_KEK = randomBytes(32).toString('base64');
  });

  afterEach(() => {
    if (original === undefined) delete process.env.MODERATION_EVIDENCE_KEK;
    else process.env.MODERATION_EVIDENCE_KEK = original;
  });

  it('round-trips plaintext through encrypt/decrypt', () => {
    const blob = encryptEvidence('user said: this is a violation');
    expect(blob.cipher.length).toBeGreaterThan(0);
    expect(blob.iv.length).toBe(12);
    expect(blob.authTag.length).toBe(16);
    expect(blob.wrappedKey.length).toBe(60);
    expect(decryptEvidence(blob)).toBe('user said: this is a violation');
  });

  it('produces a fresh DEK per record (ciphertexts differ for identical input)', () => {
    const a = encryptEvidence('same input');
    const b = encryptEvidence('same input');
    expect(a.cipher.equals(b.cipher)).toBe(false);
    expect(a.wrappedKey.equals(b.wrappedKey)).toBe(false);
  });

  it('rejects tampered ciphertext (auth tag enforced)', () => {
    const blob = encryptEvidence('integrity-protected');
    blob.cipher.writeUInt8(blob.cipher.readUInt8(0) ^ 0xff, 0);
    expect(() => decryptEvidence(blob)).toThrow();
  });

  it('rejects tampered wrapped key', () => {
    const blob = encryptEvidence('integrity-protected');
    blob.wrappedKey.writeUInt8(blob.wrappedKey.readUInt8(0) ^ 0xff, 0);
    expect(() => decryptEvidence(blob)).toThrow();
  });

  it('errors clearly when KEK is missing', () => {
    delete process.env.MODERATION_EVIDENCE_KEK;
    expect(() => encryptEvidence('x')).toThrow(/MODERATION_EVIDENCE_KEK/);
  });

  it('errors clearly when KEK is the wrong length', () => {
    process.env.MODERATION_EVIDENCE_KEK = Buffer.from('too-short').toString('base64');
    expect(() => encryptEvidence('x')).toThrow(/32 bytes/);
  });
});
