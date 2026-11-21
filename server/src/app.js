import express from 'express';
import cors from 'cors';
import { OtpStore, normalizePhone } from './otp.js';

/**
 * OTP API. Every /otp route needs a valid Firebase ID token (Authorization: Bearer <token>),
 * verified with the Firebase Admin SDK, so only signed-in Sarva users can request codes.
 */
export function createApp({ verifyIdToken, sendSms, allowedOrigins = [], store = new OtpStore(), countryCode = '+91' }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '2kb' }));
  app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)), methods: ['POST'] }));

  app.get('/health', (_req, res) => res.json({ ok: true, sms: Boolean(sendSms) }));

  // Fail closed: no token, a bad token, or a missing verifier all get 401.
  const requireUser = async (req, res, next) => {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token || !verifyIdToken) return res.status(401).json({ message: 'Sign in first.' });
    try {
      const decoded = await verifyIdToken(token);
      req.uid = decoded.uid;
      return next();
    } catch {
      return res.status(401).json({ message: 'Sign in first.' });
    }
  };

  app.post('/otp/send', requireUser, async (req, res) => {
    if (!sendSms) return res.status(503).json({ message: 'SMS is not configured on the server.' });
    const phone = normalizePhone(req.body?.phone, countryCode);
    if (!phone) return res.status(400).json({ message: 'Enter a valid mobile number.' });
    const issued = store.issue(req.uid, phone);
    if (!issued.ok) return res.status(issued.status).json({ message: issued.message });
    const sent = await sendSms(phone, `Your Sarva verification code is ${issued.code}. It expires in 5 minutes.`);
    if (!sent) {
      store.revoke(req.uid, phone);
      return res.status(502).json({ message: 'Could not send the SMS. Try again shortly.' });
    }
    return res.json({ sent: true });
  });

  app.post('/otp/verify', requireUser, (req, res) => {
    const phone = normalizePhone(req.body?.phone, countryCode);
    if (!phone || !/^[0-9]{6}$/.test(String(req.body?.otp ?? ''))) {
      return res.status(400).json({ message: 'Enter the 6-digit code.' });
    }
    const verified = store.check(req.uid, phone, req.body.otp);
    return verified ? res.json({ verified: true }) : res.status(400).json({ verified: false, message: 'Invalid or expired code.' });
  });

  return app;
}
