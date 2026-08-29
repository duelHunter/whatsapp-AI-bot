-- Adds fields to store what an automated vision-model pass extracted from a
-- payment receipt photo, so admins can see it alongside the image when
-- approving/rejecting. Extraction is advisory only — it never auto-confirms
-- an order; approve/reject remains a human decision.

ALTER TABLE public.payment_receipts
  ADD COLUMN IF NOT EXISTS extracted_amount numeric,
  ADD COLUMN IF NOT EXISTS extracted_reference text,
  ADD COLUMN IF NOT EXISTS extracted_date text,
  ADD COLUMN IF NOT EXISTS extracted_bank_name text,
  ADD COLUMN IF NOT EXISTS extraction_confidence text CHECK (extraction_confidence IN ('high', 'medium', 'low') OR extraction_confidence IS NULL),
  ADD COLUMN IF NOT EXISTS extraction_notes text;
