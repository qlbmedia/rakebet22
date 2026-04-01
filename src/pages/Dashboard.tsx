import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, User, Shield } from 'lucide-react';
import { useEffect } from 'react';

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.user_metadata?.display_name || user.email;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome, {displayName}</h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield size={16} />
            <span>Your data is securely stored in Supabase — nothing on Lovable's cloud.</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">User ID:</strong> {user.id}
          </div>
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">Created:</strong> {new Date(user.created_at).toLocaleDateString()}
          </div>
        </div>

        <Button variant="outline" onClick={async () => { await signOut(); navigate('/'); }} className="gap-2">
          <LogOut size={16} /> Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
