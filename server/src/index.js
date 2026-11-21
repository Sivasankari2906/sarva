import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { createApp } from './app.js';
import { createTextbeeSender } from './textbee.js';

// Firebase Admin uses GOOGLE_APPLICATION_CREDENTIALS (path to a service-account key) to verify ID tokens.
initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID });

const sendSms = createTextbeeSender({
  apiKey: process.env.TEXTBEE_API_KEY,
  baseUrl: process.env.TEXTBEE_BASE_URL,
  deviceId: process.env.TEXTBEE_DEVICE_ID,
});

const app = createApp({
  verifyIdToken: (token) => getAuth().verifyIdToken(token),
  sendSms,
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map((s) => s.trim()),
  countryCode: process.env.SMS_DEFAULT_COUNTRY_CODE || '+91',
});

// Loopback by default. On a hosting platform set HOST=0.0.0.0 behind its HTTPS front end.
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 8787);
app.listen(port, host, () => {
  console.log(`Sarva OTP server on http://${host}:${port} (SMS ${sendSms ? 'enabled' : 'disabled: set TEXTBEE_API_KEY'})`);
});
