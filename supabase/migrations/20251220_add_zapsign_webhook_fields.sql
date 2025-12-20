-- Migration to add webhook-related fields to zapsign_documents table
-- These fields are updated when ZapSign sends webhook events for document signatures

-- Add new columns for webhook data
ALTER TABLE zapsign_documents 
ADD COLUMN IF NOT EXISTS signed_file_url TEXT,
ADD COLUMN IF NOT EXISTS last_signer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_signer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;

-- Create index on zapsign_token for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_zapsign_documents_token ON zapsign_documents(zapsign_token);

COMMENT ON COLUMN zapsign_documents.signed_file_url IS 'URL of the signed PDF file (from ZapSign webhook)';
COMMENT ON COLUMN zapsign_documents.last_signer_name IS 'Name of the last person who signed (from ZapSign webhook)';
COMMENT ON COLUMN zapsign_documents.last_signer_email IS 'Email of the last person who signed (from ZapSign webhook)';
COMMENT ON COLUMN zapsign_documents.signed_at IS 'Timestamp when the document was signed (from ZapSign webhook)';
