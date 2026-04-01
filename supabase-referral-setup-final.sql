-- Referral System Tables for Rakebet
-- IMPORTANT: Run these commands in Supabase Dashboard with proper permissions
-- Go to: Database > Table Editor > Create new table (for new tables)
-- Or: Database > SQL Editor (for indexes and functions)

-- 1. Create referrals table (use Table Editor for this)
CREATE TABLE public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_user_id)
);

-- 2. Create referral_earnings table (use Table Editor for this)
CREATE TABLE public.referral_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  type VARCHAR(20) DEFAULT 'signup' CHECK (type IN ('signup', 'deposit', 'wager')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add columns to auth.users table (use Table Editor > auth.users > Edit table)
-- Add these columns to the existing auth.users table:
-- referral_code VARCHAR(10)
-- referred_by UUID REFERENCES auth.users(id)

-- 4. Create indexes (use SQL Editor) - FIXED SYNTAX
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred_user_id ON public.referrals(referred_user_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referral_earnings_referrer_id ON public.referral_earnings(referrer_id);
CREATE INDEX idx_referral_earnings_referred_user_id ON public.referral_earnings(referred_user_id);

-- 5. Create stats function (use SQL Editor)
CREATE OR REPLACE FUNCTION public.get_user_referral_stats(user_uuid UUID)
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
  FROM public.referrals r
  LEFT JOIN public.referral_earnings re ON r.referrer_id = re.referrer_id
  WHERE r.referrer_id = user_uuid
  GROUP BY r.referrer_id;
$$
LANGUAGE sql
SECURITY DEFINER;

-- 6. Create trigger to automatically set referral code for new users (use SQL Editor)
CREATE OR REPLACE FUNCTION public.set_user_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate referral code from first 8 characters of user ID
  NEW.referral_code = LEFT(NEW.id::text, 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_set_referral_code
  BEFORE INSERT ON public.auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_referral_code();

-- 7. Create trigger to record referral when user signs up with code (use SQL Editor)
CREATE OR REPLACE FUNCTION public.record_referral()
RETURNS TRIGGER AS $$
DECLARE
  referrer_record RECORD;
BEGIN
  -- Check if user was referred
  IF NEW.referral_code IS NOT NULL THEN
    -- Find the referrer
    SELECT id INTO referrer_record 
    FROM public.auth.users 
    WHERE referral_code = NEW.referral_code 
    LIMIT 1;
    
    -- If referrer found, create referral record
    IF referrer_record.id IS NOT NULL THEN
      INSERT INTO public.referrals (
        referrer_id,
        referred_user_id,
        referral_code,
        status
      ) VALUES (
        referrer_record.id,
        NEW.id,
        NEW.referral_code,
        'confirmed'
      );
      
      -- Create signup bonus earning
      INSERT INTO public.referral_earnings (
        referrer_id,
        referred_user_id,
        amount,
        type,
        status
      ) VALUES (
        referrer_record.id,
        NEW.id,
        5.00, -- $5 signup bonus
        'signup',
        'confirmed'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_record_referral
  BEFORE INSERT ON public.auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.record_referral();
