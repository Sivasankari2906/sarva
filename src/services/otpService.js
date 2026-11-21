import { auth } from './firebase';

// Set REACT_APP_OTP_SERVER_URL to the Sarva OTP server (server/) to send real SMS codes.
// Without it the app stays in demo mode and shows the code on screen.
const OTP_SERVER_URL = (process.env.REACT_APP_OTP_SERVER_URL || '').replace(/\/$/, '');

export const smsOtpEnabled = Boolean(OTP_SERVER_URL);

async function call(path, body) {
  const token = await auth.currentUser.getIdToken();
  const res = await fetch(`${OTP_SERVER_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && !(path === '/otp/verify' && res.status === 400)) {
    throw new Error(data.message || 'Request failed. Try again.');
  }
  return data;
}

export const sendSmsOtp = (phone) => call('/otp/send', { phone });
export const verifySmsOtp = async (phone, otp) => (await call('/otp/verify', { phone, otp })).verified === true;
