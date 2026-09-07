import { nowIso, ulid } from "./ids";

const STUB_USER_ID = "stub-user";

export function stubUserId(): string {
  return STUB_USER_ID;
}

export async function creditBalance(db: D1Database, userId: string): Promise<number> {
  const row = await db
    .prepare("SELECT COALESCE(SUM(delta), 0) AS credits FROM credit_ledger WHERE user_id = ?")
    .bind(userId)
    .first<{ credits: number | string }>();
  return Number(row?.credits ?? 0);
}

export async function ensureLocalStubUser(db: D1Database): Promise<string> {
  const now = nowIso();
  await db
    .prepare(
      `INSERT INTO users (
         id, google_sub, email, email_verified, display_name, role, created_at, updated_at
       ) VALUES (?, 'stub-google-sub', 'local@safezoneready.invalid', 1, 'Local', 'user', ?, ?)
       ON CONFLICT(id) DO NOTHING`,
    )
    .bind(STUB_USER_ID, now, now)
    .run();
  await grantWelcomeOnce(db, STUB_USER_ID);
  return STUB_USER_ID;
}

export async function grantWelcomeOnce(db: D1Database, userId: string): Promise<void> {
  const now = nowIso();
  const updated = await db
    .prepare(
      "UPDATE users SET welcome_credits_granted_at = ?, updated_at = ? WHERE id = ? AND welcome_credits_granted_at IS NULL",
    )
    .bind(now, now, userId)
    .run();
  if ((updated.meta.changes ?? 0) !== 1) {
    return;
  }
  await insertLedger(db, {
    userId,
    delta: 2,
    reason: "welcome",
  });
}

export async function debitFixIfFunds(db: D1Database, userId: string, jobId: string): Promise<boolean> {
  const result = await db
    .prepare(
      `INSERT INTO credit_ledger (id, user_id, delta, reason, job_id, stripe_event_id, sku_code, created_at)
       SELECT ?, ?, -1, 'debit_fix', ?, NULL, NULL, ?
       WHERE (SELECT COALESCE(SUM(delta), 0) FROM credit_ledger WHERE user_id = ?) >= 1`,
    )
    .bind(ulid(), userId, jobId, nowIso(), userId)
    .run();
  return (result.meta.changes ?? 0) === 1;
}

export async function insertLedger(
  db: D1Database,
  row: {
    userId: string;
    delta: number;
    reason: string;
    jobId?: string | null;
    stripeEventId?: string | null;
    skuCode?: string | null;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO credit_ledger (id, user_id, delta, reason, job_id, stripe_event_id, sku_code, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      ulid(),
      row.userId,
      row.delta,
      row.reason,
      row.jobId ?? null,
      row.stripeEventId ?? null,
      row.skuCode ?? null,
      nowIso(),
    )
    .run();
}

export async function refundJob(db: D1Database, userId: string, jobId: string): Promise<void> {
  try {
    await insertLedger(db, {
      userId,
      delta: 1,
      reason: "refund",
      jobId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/unique|constraint/i.test(message)) {
      throw error;
    }
  }
}

export async function countInflightJobs(db: D1Database, userId?: string): Promise<number> {
  if (userId) {
    const row = await db
      .prepare(
        "SELECT COUNT(*) AS n FROM jobs WHERE user_id = ? AND status IN ('queued', 'running')",
      )
      .bind(userId)
      .first<{ n: number | string }>();
    return Number(row?.n ?? 0);
  }
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM jobs WHERE status IN ('queued', 'running')")
    .first<{ n: number | string }>();
  return Number(row?.n ?? 0);
}

export async function countJobsSince(db: D1Database, iso: string): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM jobs WHERE created_at >= ?")
    .bind(iso)
    .first<{ n: number | string }>();
  return Number(row?.n ?? 0);
}
