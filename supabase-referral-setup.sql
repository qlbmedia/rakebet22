-- Referral System Tables for Rakebet
-- Run these SQL commands in your Supabase SQL editor

-- Table to track referral relationships
CREATE TABLE referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_user_id)
);

-- Table to track referral earnings and stats
CREATE TABLE referral_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  type VARCHAR(20) DEFAULT 'signup' CHECK (type IN ('signup', 'deposit', 'wager')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add referral_code column to users table if it doesn't exist
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(10);

-- Add referred_by column to track who referred this user
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer_id ON referral_earnings(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referred_user_id ON referral_earnings(referred_user_id);

-- Function to get referral stats
CREATE OR REPLACE FUNCTION get_user_referral_stats(user_uuid UUID)
RETURNS TABLE (
  total_referrals BIGINT,
  active_referrals BIGINT,
  total_earned DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT r.referred_user_id) as total_referrals,
    COUNT(DISTINCT CASE WHEN r.status = 'confirmed' THEN r.referred_user_id END) as active_referrals,
    COALESCE(SUM(re.amount), 0) as total_earned
  FROM referrals r
  LEFT JOIN referral_earnings re ON r.referrer_id = re.referrer_id
  WHERE r.referrer_id = user_uuid
  GROUP BY r.referrer_id;
$$
LANGUAGE sql
SECURITY DEFINER;
