// BLE-63 / Appendix A.2 — at-rest encryption for `moderation_action_log` evidence.
//
// Per-record AES-256-GCM. Each row gets a fresh 32-byte data-encryption-key
// (DEK) generated at write time; we then wrap that DEK with a master KEK
// loaded from `MODERATION_EVIDENCE_KEK` (env, base64) and store the wrapped
// DEK alongside ciphertext + IV + auth tag on the row.
//
// This pattern lets us rotate the KEK in place (re-wrap DEKs) without
// re-encrypting any evidence ciphertext.

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const KEY_LEN = 32;
const IV_LEN = 12;
const TAG_LEN = 16;

export interface EvidenceCiphertext {
  cipher: Buffer;
  iv: Buffer;
  authTag: Buffer;
  wrappedKey: Buffer;
}

function loadKek(): Buffer {
  const raw = process.env.MODERATION_EVIDENCE_KEK;
  if (!raw) {
    throw new Error('MODERATION_EVIDENCE_KEK env var is required for moderation evidence I/O');
  }
  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== KEY_LEN) {
    throw new Error(
      `MODERATION_EVIDENCE_KEK must decode to ${KEY_LEN} bytes; got ${buf.length}`,
    );
  }
  return buf;
}

function wrapKey(dek: Buffer, kek: Buffer): Buffer {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, kek, iv);
  const ct = Buffer.concat([cipher.update(dek), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]);
}

function unwrapKey(wrapped: Buffer, kek: Buffer): Buffer {
  if (wrapped.length < IV_LEN + TAG_LEN) {
    throw new Error('wrapped key is malformed');
  }
  const iv = wrapped.subarray(0, IV_LEN);
  const tag = wrapped.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = wrapped.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, kek, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]);
}

export function encryptEvidence(plaintext: string): EvidenceCiphertext {
  const kek = loadKek();
  const dek = randomBytes(KEY_LEN);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, dek, iv);
  const cipherBuf = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const wrappedKey = wrapKey(dek, kek);
  dek.fill(0);
  return { cipher: cipherBuf, iv, authTag, wrappedKey };
}

export function decryptEvidence(blob: EvidenceCiphertext): string {
  const kek = loadKek();
  const dek = unwrapKey(blob.wrappedKey, kek);
  try {
    const decipher = createDecipheriv(ALGO, dek, blob.iv);
    decipher.setAuthTag(blob.authTag);
    return Buffer.concat([decipher.update(blob.cipher), decipher.final()]).toString('utf8');
  } finally {
    dek.fill(0);
  }
}
