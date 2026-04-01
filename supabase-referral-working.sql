-- Referral System Tables for Rakebet
-- WORKING VERSION - Compatible with Supabase Auth System
-- Run these commands in Supabase Dashboard

-- STEP 1: Create referrals table (use Table Editor)
CREATE TABLE public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL, -- Store referrer ID directly
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_user_id)
);

-- STEP 2: Create referral_earnings table (use Table Editor)
CREATE TABLE public.referral_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL, -- Store referrer ID directly
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  type VARCHAR(20) DEFAULT 'signup' CHECK (type IN ('signup', 'deposit', 'wager')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 3: Add columns to auth.users table (use Table Editor)
-- Add these columns to the existing auth.users table:
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(10);

ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS referred_by UUID;

-- STEP 4: Create indexes (use SQL Editor)
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred_user_id ON public.referrals(referred_user_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referral_earnings_referrer_id ON public.referral_earnings(referrer_id);
CREATE INDEX idx_referral_earnings_referred_user_id ON public.referral_earnings(referred_user_id);

-- STEP 5: Simple trigger to set referral code (use SQL Editor)
CREATE OR REPLACE FUNCTION public.set_user_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.referral_code = LEFT(NEW.id::text, 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_set_referral_code
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_referral_code();

-- STEP 6: Simple trigger to record referrals (use SQL Editor)
CREATE OR REPLACE FUNCTION public.record_referral()
RETURNS TRIGGER AS $$
DECLARE
  referrer_user_id UUID;
BEGIN
  -- Check if user was referred
  IF NEW.referral_code IS NOT NULL THEN
    -- Find the referrer by referral code (not by user ID)
    SELECT id INTO referrer_user_id 
    FROM auth.users 
    WHERE referral_code = NEW.referral_code 
    AND id != NEW.id
    LIMIT 1;
    
    -- If referrer found, create referral record
    IF referrer_user_id IS NOT NULL THEN
      INSERT INTO public.referrals (
        referrer_id,
        referred_user_id,
        referral_code,
        status,
        created_at,
        updated_at
      ) VALUES (
        referrer_user_id,
        NEW.id,
        NEW.referral_code,
        'confirmed',
        NOW(),
        NOW()
      );
      
      -- Create signup bonus earning
      INSERT INTO public.referral_earnings (
        referrer_id,
        referred_user_id,
        amount,
        type,
        status,
        created_at,
        updated_at
      ) VALUES (
        referrer_user_id,
        NEW.id,
        5.00,
        'signup',
        'confirmed',
        NOW(),
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_record_referral
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.record_referral();
