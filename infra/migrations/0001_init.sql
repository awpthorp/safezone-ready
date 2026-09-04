-- Safe Zone Ready D1 schema. See docs/SPEC.md §7.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  google_sub TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT 0,
  display_name TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT UNIQUE,
  welcome_credits_granted_at TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  banned_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  ip_hash TEXT,
  user_agent_hash TEXT
);

CREATE TABLE credit_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  job_id TEXT,
  stripe_event_id TEXT,
  sku_code TEXT,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX credit_ledger_job_reason
  ON credit_ledger(job_id, reason)
  WHERE job_id IS NOT NULL;

CREATE INDEX credit_ledger_user_created
  ON credit_ledger(user_id, created_at);

CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  r2_key TEXT NOT NULL UNIQUE,
  sha256 TEXT NOT NULL,
  mime TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX assets_expires ON assets(expires_at);

CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  asset_id TEXT NOT NULL REFERENCES assets(id),
  status TEXT NOT NULL,
  placement_ids_json TEXT NOT NULL,
  must_keep_text_json TEXT NOT NULL,
  model_primary TEXT NOT NULL,
  model_escalated TEXT,
  idempotency_key TEXT NOT NULL,
  output_r2_key TEXT,
  score_before_json TEXT,
  score_after_json TEXT,
  verify_json TEXT,
  failure_code TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  UNIQUE (user_id, idempotency_key)
);

CREATE INDEX jobs_user_created ON jobs(user_id, created_at);
CREATE INDEX jobs_status_created ON jobs(status, created_at);

CREATE TABLE stripe_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  processed_at TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL
);

CREATE TABLE oauth_states (
  state TEXT PRIMARY KEY,
  pkce_verifier TEXT NOT NULL,
  return_path TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
