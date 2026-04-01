import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Wallet, Gift, Bell } from "lucide-react";

interface Notification {
  id: string;
  type: "deposit_pending" | "deposit_confirmed" | "deposit_finished" | "deposit_partial" | "reward";
  title: string;
  description: string;
  icon_url?: string;
  pay_currency?: string;
  created_at: string;
}

const getCryptoIcon = (currency: string) =>
  `https://cdn.jsdelivr.net/gh/nicholasgasior/cryptocurrency-icons@master/svg/color/${currency.toLowerCase()}.svg`;

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "about 1 hour ago" : `about ${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
};

const getNotificationIcon = (type: string, currency?: string) => {
  if (type.startsWith("deposit") && currency) {
    return (
      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <img src={getCryptoIcon(currency)} alt={currency} className="w-7 h-7" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      </div>
    );
  }
  if (type === "reward") {
    return (
      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shrink-0">
        <Gift size={24} className="text-primary" />
      </div>
    );
  }
  return (
    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shrink-0">
      <Bell size={24} className="text-muted-foreground" />
    </div>
  );
};

const getBorderColor = (type: string) => {
  if (type === "deposit_finished") return "border-l-primary";
  if (type === "deposit_pending" || type === "deposit_confirmed") return "border-l-primary/50";
  if (type === "deposit_partial") return "border-l-yellow-500";
  if (type === "reward") return "border-l-primary";
  return "border-l-border";
};

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  // Build notifications from deposits
  useEffect(() => {
    if (!user) return;

    const fetchDeposits = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("deposits")
        .select("payment_id, pay_currency, price_amount, actually_paid, status, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (data) {
        const notifs: Notification[] = data.map((d) => {
          const currency = d.pay_currency?.toUpperCase() || "CRYPTO";
          const paid = Number(d.actually_paid || 0);
          const usd = Number(d.price_amount || 0);

          let type: Notification["type"] = "deposit_pending";
          let title = "Deposit Pending";
          let description = `Your deposit of ${currency} ${paid > 0 ? paid.toFixed(8) : ""} is currently pending`;

          if (d.status === "finished") {
            type = "deposit_finished";
            title = "Deposit Successful";
            description = `Your deposit of ${currency} ${paid.toFixed(8)} is now complete and $${usd.toFixed(2)} has been added to your balance`;
          } else if (d.status === "partially_paid") {
            type = "deposit_partial";
            title = "Deposit Partially Paid";
            description = `Your deposit of ${currency} ${paid.toFixed(8)} was partially paid — $${usd.toFixed(2)} credited`;
          } else if (d.status === "confirming" || d.status === "sending") {
            type = "deposit_confirmed";
            title = "Deposit Confirming";
            description = `Your deposit of ${currency} ${paid > 0 ? paid.toFixed(8) : ""} is being confirmed on the blockchain`;
          }

          return {
            id: d.payment_id?.toString() || Math.random().toString(),
            type,
            title,
            description,
            pay_currency: d.pay_currency,
            created_at: d.updated_at || d.created_at,
          };
        });
        setNotifications(notifs);
      }
      setLoading(false);
    };

    fetchDeposits();

    // Real-time updates
    const channel = supabase
      .channel("notif-deposits")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deposits", filter: `user_id=eq.${user.id}` },
        () => { fetchDeposits(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-center gap-3">
        <Bell size={24} className="text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Bell size={40} className="mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border border-border bg-card p-5 flex items-start gap-4 border-l-4 ${getBorderColor(n.type)} transition-colors hover:bg-accent/30`}
            >
              {getNotificationIcon(n.type, n.pay_currency)}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-bold text-foreground text-base">{n.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{n.description}</p>
                <p className="text-xs text-primary/70 font-medium mt-1">{formatTimeAgo(n.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
