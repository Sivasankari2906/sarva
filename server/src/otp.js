import crypto from 'node:crypto';

export const OTP_TTL_MS = 5 * 60 * 1000;
export const RESEND_MS = 30 * 1000;
export const MAX_SENDS_PER_HOUR = 5;
export const MAX_ATTEMPTS = 5;

/** Turns "98765 43210", "+91 98765-43210" or "919876543210" into E.164, or returns null. */
export function normalizePhone(phone, countryCode = '+91') {
  if (typeof phone !== 'string') return null;
  const digits = phone.replace(/[^0-9+]/g, '');
  if (digits.startsWith('+')) return /^\+[0-9]{10,15}$/.test(digits) ? digits : null;
  if (/^[0-9]{10}$/.test(digits)) return countryCode + digits;
  if (/^[0-9]{11,15}$/.test(digits)) return '+' + digits;
  return null;
}

const hash = (uid, phone, code) => crypto.createHash('sha256').update(`${uid}|${phone}|${code}`).digest('hex');

/**
 * In-memory OTP store. Codes are kept only as hashes, expire after 5 minutes and allow 5 attempts.
 * Fine for a single server instance; use a shared store (e.g. Redis) if you run several.
 */
export class OtpStore {
  constructor(now = () => Date.now()) {
    this.now = now;
    this.codes = new Map(); // `${uid}|${phone}` -> { hash, expiresAt, attempts }
    this.sends = new Map(); // uid -> [timestamps]
  }

  /** Returns { ok: true, code } or { ok: false, status, message } when rate limited. */
  issue(uid, phone) {
    const t = this.now();
    const recent = (this.sends.get(uid) || []).filter((s) => t - s < 60 * 60 * 1000);
    if (recent.length && t - recent[recent.length - 1] < RESEND_MS) {
      return { ok: false, status: 429, message: 'Please wait 30 seconds before requesting another code.' };
    }
    if (recent.length >= MAX_SENDS_PER_HOUR) {
      return { ok: false, status: 429, message: 'Too many codes requested. Try again in an hour.' };
    }
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    this.codes.set(`${uid}|${phone}`, { hash: hash(uid, phone, code), expiresAt: t + OTP_TTL_MS, attempts: 0 });
    this.sends.set(uid, [...recent, t]);
    return { ok: true, code };
  }

  /** Forgets a code that could not be delivered, so the user is not blocked by the resend limit. */
  revoke(uid, phone) {
    this.codes.delete(`${uid}|${phone}`);
    const sends = this.sends.get(uid) || [];
    this.sends.set(uid, sends.slice(0, -1));
  }

  /** Returns true once for the right code; wrong, expired or over-attempted codes return false. */
  check(uid, phone, code) {
    const key = `${uid}|${phone}`;
    const entry = this.codes.get(key);
    if (!entry || this.now() > entry.expiresAt || entry.attempts >= MAX_ATTEMPTS) {
      this.codes.delete(key);
      return false;
    }
    entry.attempts += 1;
    const given = Buffer.from(hash(uid, phone, String(code ?? '')), 'hex');
    const expected = Buffer.from(entry.hash, 'hex');
    if (crypto.timingSafeEqual(given, expected)) {
      this.codes.delete(key);
      return true;
    }
    return false;
  }
}
