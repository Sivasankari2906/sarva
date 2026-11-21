/**
 * Sends one SMS through textbee (https://github.com/textbee/textbee), hosted or self-hosted.
 * Returns true if the gateway accepted the message. Never logs the message, which holds the OTP.
 */
export function createTextbeeSender({ apiKey, baseUrl, deviceId, fetchImpl = fetch, timeoutMs = 10_000 }) {
  if (!apiKey) return null;
  const base = (baseUrl && baseUrl.trim()) || 'https://api.textbee.dev';
  return async (to, message) => {
    const body = { recipients: [to], message };
    if (deviceId) body.deviceId = deviceId;
    try {
      const res = await fetchImpl(`${base.replace(/\/$/, '')}/api/v1/gateway/send-sms`, {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
      return res.ok;
    } catch {
      return false;
    }
  };
}
