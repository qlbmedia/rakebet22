import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { registerWallet } from '@/lib/walletApi';
import { supabase } from '@/lib/supabase';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Extract referral code from URL
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, name);

    if (error) {
      setLoading(false);
      toast({ title: 'Signup failed', description: error.message, variant: 'destructive' });
      return;
    }

    // Register wallet addresses with the backend
    try {
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        await registerWallet(newUser.id, name);
      }
    } catch (walletErr) {
      console.warn('Wallet registration deferred:', walletErr);
    }

    setLoading(false);
    toast({ title: 'Account created!', description: 'Welcome to Rakebet!' });
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <UserPlus className="mx-auto h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Create account</h1>
          <p className="text-muted-foreground text-sm">Join Rakebet today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {referralCode && (
            <div className="space-y-2">
              <Label htmlFor="referral">Referral Code</Label>
              <Input 
                id="referral" 
                value={referralCode} 
                readOnly 
                className="bg-muted/30 font-mono text-sm" 
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
