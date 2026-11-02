# ANUSMITA WhatsApp Cloud API integration

## Server environment (Netlify Functions scope, never public/NEXT_PUBLIC)
- `WHATSAPP_PHONE_NUMBER_ID` — WhatsApp Business Cloud API phone number ID
- `WHATSAPP_ACCESS_TOKEN` — long-lived business system user access token, with WhatsApp messaging permissions
- `WHATSAPP_VERIFY_TOKEN` — random secret created by merchant, copied to Meta webhook setup
- `META_APP_SECRET` — App Secret from the Meta developer app

Do not commit real credentials. Redeploy after setting environment variables.

## Meta registration
Register HTTPS callback: `https://anusmita.netlify.app/api/webhooks/whatsapp`
Verify token must match `WHATSAPP_VERIFY_TOKEN`. Subscribe the WhatsApp Business Account to the `messages` webhook field and grant the required Meta business/app/phone permissions. Configure recipient opt-in and business phone registration. WhatsApp test number and temporary token may be sandbox-only; production needs production credentials.

## Behavior
- Callback GET verifies challenge; POST requires `X-Hub-Signature-256` and accepts only payloads for the configured phone number ID.
- Text messages become unique provider+message ID records in existing SocialInbound. Media is NOT downloaded or displayed.
- Social Inbox shows recorded WhatsApp threads. A logged-in owner/admin/support agent may explicitly submit text to a verified phone number with a recent incoming message within a conservative 23-hour window.
- Message acceptance from Graph API **does not mean delivered/read**. Failed or ambiguous sends are locked for manual review; do not blindly retry.
- Messenger/Instagram remain inbound-only; no automation/templates/broadcasts.
- No message is dispatched just because env variables were set. Explicit staff Send action required.
- Webhook subscription and provider testing are required: environment keys alone are insufficient to confirm live connectivity.
- Existing inbound retention policy expires messages after 30 days.

## Manual test plan
1. Add env vars in Netlify and deploy preview; ensure webhook GET challenge succeeds with correct token and fails with wrong token.
2. Verify unsigned or invalid-HMAC POST is denied, signed WhatsApp inbound message is stored once even on duplicate provider deliveries, and unrelated phone IDs are ignored.
3. Send WhatsApp test message from an approved recipient; verify it appears in the agent inbox.
4. Reply manually within 23 hours and compare the returned WhatsApp provider message ID with Meta Manager status.
5. Verify unauthorized sessions, invalid origin and missing credentials cannot send, and expired inbound conversations reject arbitrary free-form replies.
6. Complete browser responsive, audit and real provider E2E checks before production release.
