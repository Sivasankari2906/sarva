/**
 * Sends one SMS through textbee (https://github.com/textbee/textbee), hosted or self-hosted.
 * Returns true if the gateway accepted the message. Never logs the message, which holds the OTP.
 */
export function createTextbeeSender({ apiKey, baseUrl = 'https://api.textbee.dev', deviceId, fetchImpl = fetch }) {
  if (!apiKey) return null;
  return async (to, message) => {
    const body = { recipients: [to], message };
    if (deviceId) body.deviceId = deviceId;
    try {
      const res = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/api/v1/gateway/send-sms`, {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return res.ok;
    } catch {
      return false;
    }
  };
}
