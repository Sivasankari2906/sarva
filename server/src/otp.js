import crypto from 'node:crypto';

export const OTP_TTL_MS = 5 * 60 * 1000;
export const RESEND_MS = 30 * 1000;
export const MAX_SENDS_PER_HOUR = 5;
export const MAX_ATTEMPTS = 5;

/** Turns "98765 43210", "+91 98765-43210" or "919876543210" into E.164, or returns null. */
export function normalizePhone(phone, countryCode = '+91') {
  if (typeof phone !== 'string') return null;
  let digits = phone.replace(/[^0-9+]/g, '');
  if (digits.startsWith('+')) return /^\+[1-9][0-9]{9,14}$/.test(digits) ? digits : null;
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1); // trunk prefix
  if (countryCode === '+91' ? /^[6-9][0-9]{9}$/.test(digits) : /^[0-9]{10}$/.test(digits)) return countryCode + digits;
  if (/^[1-9][0-9]{10,14}$/.test(digits)) return '+' + digits;
  return null;
}

const hash = (uid, phone, code) => crypto.createHash('sha256').update(`${uid}|${phone}|${code}`).digest('hex');

/**
 * In-memory OTP store. Codes are kept only as hashes, expire after 5 minutes and allow 5 attempts.
 * Fine for a single server instance; use a shared store (e.g. Redis) if you run several.
 */
const HOUR = 60 * 60 * 1000;

export class OtpStore {
  /** maxPerHour caps all SMS sent by this server, to limit cost if accounts are created in bulk. */
  constructor(now = () => Date.now(), maxPerHour = 30) {
    this.now = now;
    this.maxPerHour = maxPerHour;
    this.codes = new Map(); // `${uid}|${phone}` -> { hash, expiresAt, attempts }
    this.sends = new Map(); // `uid:${uid}` and `phone:${phone}` -> [timestamps]
    this.all = []; // every send in the last hour
  }

  recent(key, t) {
    const list = (this.sends.get(key) || []).filter((s) => t - s < HOUR);
    if (list.length) this.sends.set(key, list); else this.sends.delete(key);
    return list;
  }

  /** Returns { ok: true, code } or { ok: false, status, message } when rate limited. */
  issue(uid, phone) {
    const t = this.now();
    this.all = this.all.filter((s) => t - s < HOUR);
    for (const [k, v] of this.codes) if (t > v.expiresAt) this.codes.delete(k);
    for (const key of [`uid:${uid}`, `phone:${phone}`]) {
      const list = this.recent(key, t);
      if (list.length && t - list[list.length - 1] < RESEND_MS) {
        return { ok: false, status: 429, message: 'Please wait 30 seconds before requesting another code.' };
      }
      if (list.length >= MAX_SENDS_PER_HOUR) {
        return { ok: false, status: 429, message: 'Too many codes requested. Try again in an hour.' };
      }
    }
    if (this.all.length >= this.maxPerHour) {
      return { ok: false, status: 429, message: 'SMS verification is busy. Try again later.' };
    }
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    this.codes.set(`${uid}|${phone}`, { hash: hash(uid, phone, code), expiresAt: t + OTP_TTL_MS, attempts: 0 });
    for (const key of [`uid:${uid}`, `phone:${phone}`]) this.sends.set(key, [...(this.sends.get(key) || []), t]);
    this.all.push(t);
    return { ok: true, code };
  }

  /** Forgets a code that could not be delivered, so the user is not blocked by the resend limit. */
  revoke(uid, phone) {
    this.codes.delete(`${uid}|${phone}`);
    for (const key of [`uid:${uid}`, `phone:${phone}`]) this.sends.set(key, (this.sends.get(key) || []).slice(0, -1));
    this.all.pop();
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
