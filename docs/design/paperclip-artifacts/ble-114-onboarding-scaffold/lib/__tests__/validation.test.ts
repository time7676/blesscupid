import { isEmail, isOtpComplete, normalizePhoneId } from '../validation';

describe('normalizePhoneId', () => {
  it('handles 0-prefix Indonesia number', () => {
    expect(normalizePhoneId('0812-345-6789')).toBe('+6281234567890');
  });
  it('handles bare 81... format', () => {
    expect(normalizePhoneId('812 345 6789')).toBe('+6281234567890');
  });
  it('handles +62 prefix', () => {
    expect(normalizePhoneId('+62 812 3456 7890')).toBe('+6281234567890');
  });
  it('handles 0062 prefix', () => {
    expect(normalizePhoneId('00628123456789')).toBe('+628123456789');
  });
  it('rejects too short', () => {
    expect(normalizePhoneId('081')).toBeNull();
  });
  it('rejects letters', () => {
    expect(normalizePhoneId('081abc4567')).toBeNull();
  });
});

describe('isEmail', () => {
  it('passes simple', () => {
    expect(isEmail('a@b.co')).toBe(true);
  });
  it('rejects no @', () => {
    expect(isEmail('hello.world')).toBe(false);
  });
});

describe('isOtpComplete', () => {
  it('exactly 6 digits', () => {
    expect(isOtpComplete('123456')).toBe(true);
    expect(isOtpComplete('12345')).toBe(false);
    expect(isOtpComplete('12345a')).toBe(false);
  });
});
