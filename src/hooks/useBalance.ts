import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface BalanceContextValue {
  balance: number | null;
  loading: boolean;
  placeBet: (amount: number) => Promise<boolean>;
  refreshBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextValue | undefined>(undefined);

export function BalanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshBalance = useCallback(async () => {
    if (!user) {
      setBalance(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_balances")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Fetch balance error:", error);
      setLoading(false);
      return;
    }

    setBalance(data?.balance ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setBalance(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    refreshBalance();

    const channel = supabase
      .channel(`game-balance-updates-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_balances", filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          const nextBalance = (payload.new as { balance?: number } | null)?.balance;

          if (typeof nextBalance === "number") {
            setBalance(nextBalance);
            return;
          }

          refreshBalance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshBalance]);

  const placeBet = useCallback(
    async (amount: number): Promise<boolean> => {
      if (!user) {
        toast({ title: "Please log in", description: "You need to be logged in to play.", variant: "destructive" });
        return false;
      }

      if (amount <= 0) {
        toast({ title: "Invalid bet", description: "Bet amount must be greater than $0.", variant: "destructive" });
        return false;
      }

      if (balance === null || balance < amount) {
        toast({ title: "Insufficient balance", description: `You need $${amount.toFixed(2)} to place this bet. Please deposit funds.`, variant: "destructive" });
        return false;
      }

      // Client-side guard only — actual deduction happens in start-game edge function
      return true;
    },
    [user, balance]
  );

  const value = useMemo(
    () => ({ balance, loading, placeBet, refreshBalance }),
    [balance, loading, placeBet, refreshBalance]
  );

  return createElement(BalanceContext.Provider, { value }, children);
}

export function useBalance() {
  const context = useContext(BalanceContext);

  if (!context) {
    throw new Error("useBalance must be used within BalanceProvider");
  }

  return context;
}
