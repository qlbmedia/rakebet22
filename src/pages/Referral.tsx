import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Copy, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Referral = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarned: 0
  });
  const [dailyStats, setDailyStats] = useState({
    usersSignedUp: 0,
    moneyDeposited: 0
  });
  const [loading, setLoading] = useState(false);

  // Generate referral link based on user ID
  useEffect(() => {
    if (user) {
      const code = user.id.slice(0, 8);
      setReferralCode(code);
      setReferralLink(`https://rakebet.us/?ref=${code}`);
      fetchReferralStats(user.id);
      fetchDailyStats(user.id);
    }
  }, [user]);

  const fetchReferralStats = async (userId: string) => {
    try {
      // Fetch referral count
      const { data: referrals } = await supabase
        .from('referrals')
        .select('id, status, created_at')
        .eq('referrer_id', userId);
      
      // Fetch referral earnings
      const { data: earnings } = await supabase
        .from('referral_earnings')
        .select('amount, status, created_at')
        .eq('referrer_id', userId);
      
      const totalReferrals = referrals?.length || 0;
      const confirmedReferrals = referrals?.filter(r => r.status === 'confirmed')?.length || 0;
      const totalEarned = earnings?.filter(e => e.status === 'confirmed').reduce((sum, e) => sum + e.amount, 0);
      
      setReferralStats({
        totalReferrals,
        activeReferrals: confirmedReferrals,
        totalEarned
      });
    } catch (error) {
      console.error("Error fetching referral stats:", error);
    }
  };

  const fetchDailyStats = async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch users signed up today
      const { data: referrals } = await supabase
        .from('referrals')
        .select('created_at')
        .eq('referrer_id', userId)
        .gte('created_at', today);
      
      // Fetch money deposited by referrals today
      const { data: earnings } = await supabase
        .from('referral_earnings')
        .select('amount')
        .eq('referrer_id', userId)
        .gte('created_at', today);
      
      const usersSignedUp = referrals?.length || 0;
      const moneyDeposited = earnings?.reduce((sum, e) => sum + e.amount, 0);
      
      setDailyStats({
        usersSignedUp,
        moneyDeposited
      });
    } catch (error) {
      console.error("Error fetching daily stats:", error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-[1100px] mx-auto">
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold text-foreground mb-4">Referral Program</h1>
          <p className="text-muted-foreground mb-6">Please sign in to access your referral page</p>
          <Button onClick={() => window.location.href = '/auth'}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-foreground tracking-tight mb-4">
          Your Referral Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Track referrals and earnings
        </p>
      </div>

      {/* Referral Code & Link */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Your Referral Code</h2>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-mono font-bold text-primary bg-primary/10 px-4 py-2 rounded-lg">
                {referralCode}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(referralCode)}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Code
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Referral Link
            </label>
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="font-mono text-sm bg-muted/30"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(referralLink)}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Total Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Referrals</span>
              <span className="text-2xl font-bold text-primary">{referralStats.totalReferrals}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Active Referrals</span>
              <span className="text-2xl font-bold text-green-600">{referralStats.activeReferrals}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Earned</span>
              <span className="text-2xl font-bold text-yellow-600">${referralStats.totalEarned.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Today's Activity</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Users Signed Up</span>
              <span className="text-2xl font-bold text-blue-600">{dailyStats.usersSignedUp}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Money Deposited</span>
              <span className="text-2xl font-bold text-green-600">${dailyStats.moneyDeposited.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Referral;
