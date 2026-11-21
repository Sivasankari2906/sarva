import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { OtpStore, normalizePhone } from '../src/otp.js';
import { createTextbeeSender } from '../src/textbee.js';

/** Starts the app on 127.0.0.1 with a fake token verifier and a fake SMS sender. */
async function start({ smsOk = true, now } = {}) {
  const sent = [];
  const store = new OtpStore(now);
  const app = createApp({
    verifyIdToken: async (t) => { if (t === 'alice-token') return { uid: 'alice' }; if (t === 'bob-token') return { uid: 'bob' }; throw new Error('bad'); },
    sendSms: async (to, msg) => { sent.push({ to, msg }); return smsOk; },
    allowedOrigins: ['http://localhost:3000'],
    store,
  });
  const server = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = async (path, body, token) => {
    const res = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
    return { status: res.status, body: await res.json() };
  };
  const code = () => sent[sent.length - 1].msg.match(/(\d{6})/)[1];
  return { post, sent, code, close: () => server.close() };
}

test('requests without a valid Firebase token are rejected', async () => {
  const s = await start();
  assert.equal((await s.post('/otp/send', { phone: '9876543210' })).status, 401);
  assert.equal((await s.post('/otp/send', { phone: '9876543210' }, 'forged')).status, 401);
  assert.equal((await s.post('/otp/verify', { phone: '9876543210', otp: '123456' })).status, 401);
  assert.equal(s.sent.length, 0);
  s.close();
});

test('sends an SMS to the normalized number and verifies the code once', async () => {
  const s = await start();
  assert.deepEqual((await s.post('/otp/send', { phone: '98765 43210' }, 'alice-token')).body, { sent: true });
  assert.equal(s.sent[0].to, '+919876543210');
  const otp = s.code();
  assert.equal((await s.post('/otp/verify', { phone: '+919876543210', otp }, 'alice-token')).body.verified, true);
  assert.equal((await s.post('/otp/verify', { phone: '+919876543210', otp }, 'alice-token')).status, 400, 'a code works only once');
  s.close();
});

test("one user cannot use another user's code", async () => {
  const s = await start();
  await s.post('/otp/send', { phone: '9876543210' }, 'alice-token');
  assert.equal((await s.post('/otp/verify', { phone: '9876543210', otp: s.code() }, 'bob-token')).status, 400);
  s.close();
});

test('wrong codes are limited to 5 attempts, after which even the right code fails', async () => {
  const s = await start();
  await s.post('/otp/send', { phone: '9876543210' }, 'alice-token');
  const otp = s.code();
  const wrong = otp === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i++) assert.equal((await s.post('/otp/verify', { phone: '9876543210', otp: wrong }, 'alice-token')).status, 400);
  assert.equal((await s.post('/otp/verify', { phone: '9876543210', otp }, 'alice-token')).status, 400);
  s.close();
});

test('resend is limited to once per 30 seconds and 5 per hour', async () => {
  let t = 1_000_000;
  const s = await start({ now: () => t });
  assert.equal((await s.post('/otp/send', { phone: '9876543210' }, 'alice-token')).status, 200);
  assert.equal((await s.post('/otp/send', { phone: '9876543210' }, 'alice-token')).status, 429);
  for (let i = 0; i < 4; i++) { t += 31_000; assert.equal((await s.post('/otp/send', { phone: '9876543210' }, 'alice-token')).status, 200); }
  t += 31_000;
  assert.equal((await s.post('/otp/send', { phone: '9876543210' }, 'alice-token')).status, 429);
  s.close();
});

test('codes expire after 5 minutes', async () => {
  let t = 1_000_000;
  const s = await start({ now: () => t });
  await s.post('/otp/send', { phone: '9876543210' }, 'alice-token');
  t += 5 * 60 * 1000 + 1;
  assert.equal((await s.post('/otp/verify', { phone: '9876543210', otp: s.code() }, 'alice-token')).status, 400);
  s.close();
});

test('a failed SMS returns 502 and does not count against the resend limit', async () => {
  const s = await start({ smsOk: false });
  assert.equal((await s.post('/otp/send', { phone: '9876543210' }, 'alice-token')).status, 502);
  assert.equal((await s.post('/otp/send', { phone: '9876543210' }, 'alice-token')).status, 502, 'not 429');
  s.close();
});

test('bad input is rejected', async () => {
  const s = await start();
  assert.equal((await s.post('/otp/send', { phone: '123' }, 'alice-token')).status, 400);
  assert.equal((await s.post('/otp/verify', { phone: '9876543210', otp: 'abc' }, 'alice-token')).status, 400);
  s.close();
});

test('phone normalization', () => {
  assert.equal(normalizePhone('9876543210'), '+919876543210');
  assert.equal(normalizePhone('+91 98765-43210'), '+919876543210');
  assert.equal(normalizePhone('919876543210'), '+919876543210');
  assert.equal(normalizePhone('12345'), null);
  assert.equal(normalizePhone(undefined), null);
});

test('textbee sender posts the right request and is off without a key', async () => {
  assert.equal(createTextbeeSender({ apiKey: '' }), null);
  let call;
  const send = createTextbeeSender({ apiKey: 'k', deviceId: 'd1', baseUrl: 'https://gw.example/', fetchImpl: async (url, init) => { call = { url, init }; return { ok: true }; } });
  assert.equal(await send('+919876543210', 'hi'), true);
  assert.equal(call.url, 'https://gw.example/api/v1/gateway/send-sms');
  assert.equal(call.init.headers['x-api-key'], 'k');
  assert.deepEqual(JSON.parse(call.init.body), { recipients: ['+919876543210'], message: 'hi', deviceId: 'd1' });
  const failing = createTextbeeSender({ apiKey: 'k', fetchImpl: async () => { throw new Error('down'); } });
  assert.equal(await failing('+919876543210', 'hi'), false);
});

// ---- review fixes

async function startWith(opts) {
  const sent = [];
  const recorded = [];
  const app = createApp({
    verifyIdToken: async (t) => ({ 'alice-token': { uid: 'alice', email_verified: true }, 'bob-token': { uid: 'bob', email_verified: false } })[t] || Promise.reject(new Error('bad')),
    sendSms: async (to, msg) => { sent.push({ to, msg }); return true; },
    recordVerification: opts.recordVerification || (async (uid, phone) => { recorded.push({ uid, phone }); }),
    allowedOrigins: [],
    store: opts.store || new OtpStore(),
    requireVerifiedEmail: opts.requireVerifiedEmail || false,
  });
  const server = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = async (path, body, token) => {
    const res = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    return { status: res.status, body: await res.json() };
  };
  return { post, sent, recorded, code: () => sent[sent.length - 1].msg.match(/(\d{6})/)[1], close: () => server.close() };
}

test('a successful verify records server-side proof and returns the normalized phone', async () => {
  const s = await startWith({});
  await s.post('/otp/send', { phone: '9876543210' }, 'alice-token');
  const r = await s.post('/otp/verify', { phone: '9876543210', otp: s.code() }, 'alice-token');
  assert.deepEqual(r.body, { verified: true, phone: '+919876543210' });
  assert.deepEqual(s.recorded, [{ uid: 'alice', phone: '+919876543210' }]);
  s.close();
});

test('if the proof cannot be saved, verify fails instead of claiming success', async () => {
  const s = await startWith({ recordVerification: async () => { throw new Error('firestore down'); } });
  await s.post('/otp/send', { phone: '9876543210' }, 'alice-token');
  assert.equal((await s.post('/otp/verify', { phone: '9876543210', otp: s.code() }, 'alice-token')).status, 503);
  s.close();
});

test('the same phone cannot be texted again within 30 seconds by another account', async () => {
  const s = await startWith({});
  assert.equal((await s.post('/otp/send', { phone: '9876543210' }, 'alice-token')).status, 200);
  assert.equal((await s.post('/otp/send', { phone: '9876543210' }, 'bob-token')).status, 429);
  s.close();
});

test('a global hourly cap stops bulk sending across many accounts', async () => {
  let t = 1_000_000;
  const store = new OtpStore(() => t, 3);
  const s = await startWith({ store });
  const phones = ['9876500001', '9876500002', '9876500003', '9876500004'];
  const users = ['alice-token', 'bob-token', 'alice-token', 'bob-token'];
  const codes = [];
  for (let i = 0; i < 4; i++) { t += 31_000; codes.push((await s.post('/otp/send', { phone: phones[i] }, users[i])).status); }
  assert.deepEqual(codes, [200, 200, 200, 429]);
  s.close();
});

test('REQUIRE_VERIFIED_EMAIL blocks accounts with an unverified email', async () => {
  const s = await startWith({ requireVerifiedEmail: true });
  assert.equal((await s.post('/otp/send', { phone: '9876543210' }, 'bob-token')).status, 403);
  assert.equal((await s.post('/otp/send', { phone: '9876543210' }, 'alice-token')).status, 200);
  s.close();
});

test('numbers with a trunk 0 are normalized and invalid Indian prefixes rejected', () => {
  assert.equal(normalizePhone('09876543210'), '+919876543210');
  assert.equal(normalizePhone('1234567890'), null);
  assert.equal(normalizePhone('+0123456789012'), null);
});

test('an empty base URL falls back to the hosted textbee API', async () => {
  let url;
  const send = createTextbeeSender({ apiKey: 'k', baseUrl: '', fetchImpl: async (u) => { url = u; return { ok: true }; } });
  await send('+919876543210', 'x');
  assert.equal(url, 'https://api.textbee.dev/api/v1/gateway/send-sms');
});
