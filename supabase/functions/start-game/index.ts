import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_GAME_TYPES = ["mines", "limbo", "plinko", "crash", "wheel", "hilo", "keno", "cases"];

function generateSeed(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create user client to validate the JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body
    const body = await req.json();
    const { game_type, bet_amount, client_seed, game_params } = body;

    // Validate game_type
    if (!VALID_GAME_TYPES.includes(game_type)) {
      return new Response(JSON.stringify({ error: "Invalid game type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate bet_amount
    if (typeof bet_amount !== "number" || bet_amount <= 0 || bet_amount > 1000000) {
      return new Response(JSON.stringify({ error: "Invalid bet amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate client_seed
    if (typeof client_seed !== "string" || client_seed.length < 1 || client_seed.length > 64) {
      return new Response(JSON.stringify({ error: "Invalid client seed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for privileged operations
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Deduct balance via place_bet RPC
    const { data: betResult, error: betError } = await adminClient.rpc("place_bet", {
      bet_amount,
      p_user_id: user.id,
    });

    if (betError || betResult === false) {
      return new Response(JSON.stringify({ error: betError?.message || "Insufficient balance" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate server seed
    const serverSeed = generateSeed();
    const serverSeedHash = await sha256(serverSeed);

    // Get next nonce for this user+game
    const { data: lastSession } = await adminClient
      .from("game_sessions")
      .select("nonce")
      .eq("user_id", user.id)
      .eq("game_type", game_type)
      .order("nonce", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nonce = (lastSession?.nonce ?? -1) + 1;

    // Create game session
    const { data: session, error: sessionError } = await adminClient
      .from("game_sessions")
      .insert({
        user_id: user.id,
        game_type,
        bet_amount,
        server_seed: serverSeed,
        server_seed_hash: serverSeedHash,
        client_seed,
        nonce,
        status: "active",
        game_params: game_params || {},
      })
      .select("id, server_seed_hash, nonce")
      .single();

    if (sessionError) {
      // Refund the bet if session creation fails
      await adminClient.rpc("credit_win", { win_amount: bet_amount, p_user_id: user.id });
      return new Response(JSON.stringify({ error: "Failed to create session" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        session_id: session.id,
        server_seed_hash: session.server_seed_hash,
        nonce: session.nonce,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
