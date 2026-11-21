# Sarva OTP server

A small Express server that sends document-verification codes by SMS through
[textbee](https://github.com/textbee/textbee), an open-source gateway that sends texts from your own Android phone.

- Every `/otp` request needs the user's Firebase ID token, checked with the Firebase Admin SDK.
- Codes are 6 digits, stored only as hashes, expire after 5 minutes and allow 5 attempts.
- One code every 30 seconds and 5 per hour per user and per phone number, plus a server-wide hourly cap (`MAX_SMS_PER_HOUR`, default 30). Set `REQUIRE_VERIFIED_EMAIL=true` to serve only users with a verified email.
- After a correct code the server writes `phone_verifications/{uid}_{phone}`; the Firestore rules only accept `verified: true` on a document when that record exists.
- Codes are kept in memory, so run a single instance (or swap in a shared store such as Redis).

## Setup

1. Install the textbee app on an Android phone with a SIM, register it at textbee.dev (or self-host textbee), and copy the API key.
2. In the Firebase console, create a service-account key (Project settings → Service accounts) and save it as `server/service-account.json`.
3. Copy `.env.example` to `.env`, fill it in, then:

```bash
cd server
npm install
set -a; source .env; set +a
npm start
```

4. Build the web app with `REACT_APP_OTP_SERVER_URL` set to the server's HTTPS URL. Without it, documents are saved as Not Verified.

## Tests

```bash
npm test
```
