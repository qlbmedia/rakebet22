import { useCallback, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const SUPABASE_URL = "https://kftseiqfzjykiqvuthyc.supabase.co";

export interface GameSessionState {
  sessionId: string | null;
  serverSeedHash: string;
  nonce: number;
  loading: boolean;
  lastVerification: {
    serverSeed: string;
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
  } | null;
}

export function useGameSession(gameType: string) {
  const { user } = useAuth();
  const [clientSeed, setClientSeed] = useState(() => {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [serverSeedHash, setServerSeedHash] = useState("");
  const [nonce, setNonce] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastVerification, setLastVerification] = useState<GameSessionState["lastVerification"]>(null);
  const sessionIdRef = useRef<string | null>(null);

  const startGame = useCallback(
    async (betAmount: number, gameParams: Record<string, any> = {}): Promise<string | null> => {
      if (!user) {
        toast({ title: "Please log in", description: "You need to be logged in to play.", variant: "destructive" });
        return null;
      }

      setLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        console.log("[useGameSession] accessToken present:", !!accessToken);
        if (!accessToken) {
          toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
          setLoading(false);
          return null;
        }

        const headers: Record<string, string> = {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdHNlaXFmemp5a2lxdnV0aHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTUwMjYsImV4cCI6MjA4OTg3MTAyNn0.T1ifcdwb25Fdl9IH5oEKrLymYloBI2PFnqm5uKK2Q18",
        };
        console.log("[useGameSession] sending headers:", Object.keys(headers));

        const res = await fetch(`${SUPABASE_URL}/functions/v1/start-game`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            game_type: gameType,
            bet_amount: betAmount,
            client_seed: clientSeed,
            game_params: gameParams,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data?.session_id) {
          const msg = data?.error || "Failed to start game";
          toast({ title: "Bet failed", description: msg, variant: "destructive" });
          setLoading(false);
          return null;
        }

        setSessionId(data.session_id);
        sessionIdRef.current = data.session_id;
        setServerSeedHash(data.server_seed_hash);
        setNonce(data.nonce);
        setLoading(false);
        return data.session_id;
      } catch (err) {
        toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" });
        setLoading(false);
        return null;
      }
    },
    [user, gameType, clientSeed]
  );

  const resolveGame = useCallback(
    async (actions: Record<string, any>, sid?: string): Promise<any | null> => {
      const resolveId = sid || sessionIdRef.current;
      if (!resolveId) {
        console.error("No active session to resolve");
        return null;
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) {
          console.error("No access token for resolve");
          return null;
        }

        const res = await fetch(`${SUPABASE_URL}/functions/v1/resolve-game`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdHNlaXFmemp5a2lxdnV0aHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTUwMjYsImV4cCI6MjA4OTg3MTAyNn0.T1ifcdwb25Fdl9IH5oEKrLymYloBI2PFnqm5uKK2Q18",
          },
          body: JSON.stringify({
            session_id: resolveId,
            actions,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data) {
          console.error("Resolve game error:", data?.error);
          return null;
        }

        // Store verification data
        setLastVerification({
          serverSeed: data.server_seed,
          serverSeedHash: data.server_seed_hash,
          clientSeed,
          nonce,
        });

        setSessionId(null);
        sessionIdRef.current = null;
        return data;
      } catch (err) {
        console.error("Resolve game error:", err);
        return null;
      }
    },
    [clientSeed, nonce]
  );

  const updateClientSeed = useCallback((seed: string) => {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    setClientSeed(seed || Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join(""));
  }, []);

  return {
    clientSeed,
    serverSeedHash,
    nonce,
    sessionId,
    loading,
    lastVerification,
    startGame,
    resolveGame,
    updateClientSeed,
  };
}
