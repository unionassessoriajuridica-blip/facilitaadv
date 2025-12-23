-- Migration: Create google_system_credentials table for system-wide Google integration
-- This table stores encrypted OAuth2 tokens for Drive, Gmail, and Calendar access
-- Once connected, ALL users can access these Google services through the system

CREATE TABLE IF NOT EXISTS google_system_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type VARCHAR(50) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  scopes TEXT[],
  email VARCHAR(255),
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  connected_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(service_type)
);

-- Add RLS policies
ALTER TABLE google_system_credentials ENABLE ROW LEVEL SECURITY;

-- SECURITY: No SELECT policy for regular users - tokens should NEVER be exposed to frontend
-- Only service role (backend) can access this table
-- Frontend should use /api/google/system/status endpoint to check connection status

-- Only admins/masters can insert/update/delete (via service role on backend)
CREATE POLICY "Service role full access" ON google_system_credentials
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create index for quick lookups
CREATE INDEX idx_google_system_credentials_service ON google_system_credentials(service_type);
CREATE INDEX idx_google_system_credentials_active ON google_system_credentials(is_active);

-- Add comment
COMMENT ON TABLE google_system_credentials IS 'System-wide Google OAuth credentials for Drive, Gmail, Calendar integration';
