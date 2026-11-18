# Activity Logs center

Route: `/admin/activity-logs`; existing `/admin?tab=Activity%20Logs` redirects here.
The original Audit collection, authentication and permissions are reused. No production
migration, backfill, deletion, index rollout or external message delivery is performed.

Implemented:
- Reference-based burgundy sidebar, responsive table and event inspector, accessible
  controls, mobile navigation, genuine empty/error/loading states and Dhaka timestamps.
- Server-side date windows (1/7/30/90 days), entity/resource filtering, literal text and
  actor search, command operators, page size 30, deterministic time/ID ordering.
- Bounded aggregation (8-second maxTimeMS), filtered severity totals and daily counts.
- Explicit action-name classification, not stored severity or verified threat scoring.
- Staff names/roles resolved without exposing emails. Unknown actors stay unknown.
- 15-second opt-in polling when visible, request-race guards and browser-local saved
  filters scoped by signed-in user ID.
- Current-page CSV export with formula neutralization and SHA-256 checksum displayed
  in the notification. It is not a signed compliance certificate or full-range export.
- Restricted details for owner/admin with settings-edit permission; deny-by-default
  legacy metadata sanitization. Analysts see metadata only. Existing raw records are
  unchanged, and redaction is performed at response time, not globally at ingestion.
- Recorded before/after snapshots only; future stock adjustments now capture actual
  onHand/reserved values in the same existing stock transaction. Old missing snapshots
  are not invented. Manual adjustment reason validation remains in place.
- Resource timeline filtering and separate append-only investigation-note documents.
  Owner/admin settings-edit permission and origin validation are enforced for notes.
  Notes are not formal supervisor sign-off or a verified review queue.

Not implemented or claimed:
- SHA-256 hash chaining, anchored integrity verification, database-level immutable
  roles, WORM storage, private R2 archival or automatic retention deletion.
- New audit events across every provider/product/CRM/auth path, comprehensive state
  snapshots, mandatory reason-code taxonomy, global ingress secret redaction.
- Request correlation capture, IP/device/geo enrichment, forensic identity inference,
  impossible travel, brute-force heatmaps, fraud/margin scoring, firewall IP blocking.
- Destructive undo, automatic rollback, refund approval, webhook replay, external
  SIEM forwarding, notification rules, weekly digests or outbound messages.
- XLSX/PDF/NDJSON full-range exports, signed certificates, cross-device saved views,
  PII unmasking, new auditor role, meta-auditing of every read/export.

Validation includes redaction/CSV/query unit tests and an authenticated isolated
MongoDB replica-set integration test for actual list aggregation, owner/analyst
permissions, unchanged original events, separate notes and transactional stock snapshots.
The integration test refuses any URI except the dedicated loopback test replica set.
Hosted browser acceptance and pixel comparison require an authenticated preview.
No fake statistics, fake audit events or sample data are shipped to the application.
