-- Dedupe pack grants if Stripe retries a webhook after a ledger write.
CREATE UNIQUE INDEX IF NOT EXISTS credit_ledger_stripe_event
  ON credit_ledger(stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;
