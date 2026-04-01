import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, Check, ArrowLeft } from "lucide-react";

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setUsername(user.user_metadata?.display_name ?? "");
    setAvatarUrl(user.user_metadata?.avatar_url ?? null);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingDeposits(true);
      const { data } = await supabase
        .from("deposits")
        .select("payment_id, pay_currency, price_amount, actually_paid, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setDeposits(data ?? []);
      setLoadingDeposits(false);
    })();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = urlData.publicUrl + "?t=" + Date.now();
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      setAvatarUrl(publicUrl);
      toast({ title: "Avatar updated!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!user || !username.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { display_name: username.trim() } });
      if (error) throw error;
      toast({ title: "Username saved!" });
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "finished") return "text-green-400";
    if (s === "partially_paid") return "text-yellow-400";
    if (s === "waiting" || s === "confirming" || s === "sending") return "text-blue-400";
    return "text-muted-foreground";
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>

      {/* Avatar */}
      <div className="flex items-center gap-6">
        <div className="relative w-20 h-20 rounded-full bg-secondary border-2 border-border overflow-hidden cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl font-bold">
              {username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? <Loader2 size={20} className="animate-spin text-foreground" /> : <Camera size={20} className="text-foreground" />}
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        <div>
          <p className="text-sm font-semibold text-foreground">Profile Picture</p>
          <p className="text-xs text-muted-foreground">Click to upload</p>
        </div>
      </div>

      {/* Username */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Username</label>
        <div className="flex gap-2">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" className="bg-secondary/50 border-border" />
          <Button onClick={handleSaveUsername} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Save
          </Button>
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Email</label>
        <Input value={user?.email ?? ""} disabled className="bg-secondary/30 border-border text-muted-foreground" />
      </div>

      {/* Deposit History */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">Deposit History</h2>
        {loadingDeposits ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : deposits.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No deposits yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Currency</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Amount (USD)</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Paid</th>
                  <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((d) => (
                  <tr key={d.payment_id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="p-3 text-foreground">{new Date(d.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-foreground uppercase">{d.pay_currency}</td>
                    <td className="p-3 text-right text-foreground">${Number(d.price_amount || 0).toFixed(2)}</td>
                    <td className="p-3 text-right text-foreground">{Number(d.actually_paid || 0).toFixed(6)}</td>
                    <td className={`p-3 text-center font-medium capitalize ${statusColor(d.status)}`}>{d.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;