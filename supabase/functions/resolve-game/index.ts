import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Crypto helpers ───
async function hmacSha256(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function generateFloat(serverSeed: string, clientSeed: string, nonce: number, cursor = 0): Promise<number> {
  const hash = await hmacSha256(serverSeed, `${clientSeed}:${nonce}:${cursor}`);
  return parseInt(hash.slice(0, 8), 16) / 0x100000000;
}

// ─── Game resolvers ───

async function resolveLimbo(serverSeed: string, clientSeed: string, nonce: number, params: any, actions: any) {
  const float = await generateFloat(serverSeed, clientSeed, nonce);
  const edge = 0.99;
  const result = Math.max(1.0, parseFloat((edge / float).toFixed(2)));
  const target = actions.target_multiplier;
  
  if (typeof target !== "number" || target < 1.01) throw new Error("Invalid target");
  
  const won = result >= target;
  const multiplier = won ? target : 0;
  const payout = won ? parseFloat((actions.bet_amount * target).toFixed(2)) : 0;
  
  return { outcome: { result, target, won }, payout, multiplier };
}

async function resolveMines(serverSeed: string, clientSeed: string, nonce: number, params: any, actions: any) {
  const totalTiles = params.grid_total || 25;
  const mineCount = params.mine_count || 5;
  const revealedTiles: number[] = actions.revealed_tiles || [];
  const cashout = actions.cashout === true;
  
  // Generate mine positions
  const positions = new Set<number>();
  let cursor = 0;
  while (positions.size < mineCount) {
    const float = await generateFloat(serverSeed, clientSeed, nonce, cursor);
    positions.add(Math.floor(float * totalTiles));
    cursor++;
  }
  
  // Check if any revealed tile is a mine
  const hitMine = revealedTiles.some((t: number) => positions.has(t));
  const safeReveals = revealedTiles.filter((t: number) => !positions.has(t)).length;
  
  // Calculate multiplier
  let mult = 1;
  for (let i = 0; i < safeReveals; i++) {
    mult *= totalTiles - i;
    mult /= totalTiles - mineCount - i;
  }
  mult = Math.max(1, parseFloat(mult.toFixed(2)));
  
  const won = !hitMine && (cashout || safeReveals >= totalTiles - mineCount);
  const payout = won ? parseFloat((actions.bet_amount * mult).toFixed(2)) : 0;
  
  return {
    outcome: { mine_positions: Array.from(positions), hit_mine: hitMine, safe_reveals: safeReveals, multiplier: mult, won },
    payout,
    multiplier: won ? mult : 0,
  };
}

async function resolvePlinko(serverSeed: string, clientSeed: string, nonce: number, params: any, actions: any) {
  const rows = params.rows || 16;
  const risk = params.risk || "low";
  const multipliers = params.multipliers; // Client sends the multiplier table
  
  if (!multipliers || !Array.isArray(multipliers)) throw new Error("Missing multipliers");
  
  // Generate path
  const path: number[] = [];
  for (let i = 0; i < rows; i++) {
    const f = await generateFloat(serverSeed, clientSeed, nonce, i);
    path.push(f < 0.5 ? 0 : 1);
  }
  
  let bucketIndex = 0;
  for (const dir of path) bucketIndex += dir;
  
  const mult = multipliers[bucketIndex] || 0;
  const payout = parseFloat((actions.bet_amount * mult).toFixed(2));
  
  return {
    outcome: { path, bucket_index: bucketIndex, multiplier: mult, won: mult >= 1 },
    payout,
    multiplier: mult,
  };
}

async function resolveCrash(serverSeed: string, clientSeed: string, nonce: number, params: any, actions: any) {
  const float = await generateFloat(serverSeed, clientSeed, nonce);
  const edge = 0.99;
  const crashPoint = float === 0 ? 1 : Math.max(1, parseFloat((edge / float).toFixed(2)));
  const cashoutAt = actions.cashout_at;
  
  if (typeof cashoutAt !== "number" || cashoutAt < 1.01) throw new Error("Invalid cashout");
  
  const won = cashoutAt <= crashPoint;
  const payout = won ? parseFloat((actions.bet_amount * cashoutAt).toFixed(2)) : 0;
  
  return {
    outcome: { crash_point: crashPoint, cashout_at: cashoutAt, won },
    payout,
    multiplier: won ? cashoutAt : 0,
  };
}

async function resolveWheel(serverSeed: string, clientSeed: string, nonce: number, params: any, actions: any) {
  const segments = params.segments; // Array of { multiplier, weight }
  if (!segments || !Array.isArray(segments)) throw new Error("Missing segments");
  
  const float = await generateFloat(serverSeed, clientSeed, nonce);
  const totalWeight = segments.reduce((s: number, seg: any) => s + seg.weight, 0);
  
  let cumulative = 0;
  let segIdx = segments.length - 1;
  for (let i = 0; i < segments.length; i++) {
    cumulative += segments[i].weight / totalWeight;
    if (float < cumulative) { segIdx = i; break; }
  }
  
  const mult = segments[segIdx].multiplier;
  const payout = parseFloat((actions.bet_amount * mult).toFixed(2));
  
  return {
    outcome: { segment_index: segIdx, multiplier: mult, won: mult > 0 },
    payout,
    multiplier: mult,
  };
}

async function resolveHilo(serverSeed: string, clientSeed: string, nonce: number, params: any, actions: any) {
  const guesses: Array<{ direction: "higher" | "lower" | "skip"; cursor: number }> = actions.guesses || [];
  const totalCards = 52;
  
  // Reconstruct the card sequence
  const cards: number[] = [];
  let cursor = 0;
  
  // First card
  const firstFloat = await generateFloat(serverSeed, clientSeed, nonce, cursor);
  cursor++;
  cards.push(Math.floor(firstFloat * totalCards));
  
  let totalMultiplier = 1;
  let lost = false;
  
  for (const g of guesses) {
    const float = await generateFloat(serverSeed, clientSeed, nonce, cursor);
    cursor++;
    const cardIdx = Math.floor(float * totalCards);
    cards.push(cardIdx);
    
    if (g.direction === "skip") continue;
    
    const prevValue = (cards[cards.length - 2] % 13) + 1;
    const curValue = (cardIdx % 13) + 1;
    
    const isHigher = curValue >= prevValue;
    const isLower = curValue <= prevValue;
    const won = g.direction === "higher" ? isHigher : isLower;
    
    if (!won) { lost = true; break; }
    
    // Calculate multiplier for this guess
    const chance = g.direction === "higher"
      ? ((13 - prevValue + 1) * 4) / (totalCards - 1) * 100
      : (prevValue * 4) / (totalCards - 1) * 100;
    const stepMult = Math.max(1.01, parseFloat(((0.99 * 100) / chance).toFixed(2)));
    totalMultiplier = parseFloat((totalMultiplier * stepMult).toFixed(2));
  }
  
  const cashout = actions.cashout === true;
  const won = !lost && cashout;
  const payout = won ? parseFloat((actions.bet_amount * totalMultiplier).toFixed(2)) : 0;
  
  return {
    outcome: { cards, won, lost, multiplier: totalMultiplier },
    payout,
    multiplier: won ? totalMultiplier : 0,
  };
}

async function resolveKeno(serverSeed: string, clientSeed: string, nonce: number, params: any, actions: any) {
  const totalNumbers = params.total_numbers || 40;
  const drawCount = params.draw_count || 10;
  const picks: number[] = actions.picks || [];
  const risk = params.risk || "medium";
  const payoutTable: number[] = params.payout_table || [];
  
  // Generate drawn numbers
  const pool = Array.from({ length: totalNumbers }, (_, i) => i + 1);
  const drawn = new Set<number>();
  let cursor = 0;
  while (drawn.size < drawCount) {
    const float = await generateFloat(serverSeed, clientSeed, nonce, cursor);
    const idx = Math.floor(float * pool.length);
    drawn.add(pool[idx]);
    pool.splice(idx, 1);
    cursor++;
  }
  
  const hits = picks.filter((n: number) => drawn.has(n)).length;
  const multiplier = payoutTable[hits] || 0;
  const payout = parseFloat((actions.bet_amount * multiplier).toFixed(2));
  
  return {
    outcome: { drawn: Array.from(drawn), hits, multiplier, won: payout > 0 },
    payout,
    multiplier,
  };
}

async function resolveCases(serverSeed: string, clientSeed: string, nonce: number, params: any, actions: any) {
  const caseCount = actions.case_count || 1;
  const items: Array<{ name: string; value: number; rarity: string; weight: number }> = params.items || [];
  
  if (!items.length) throw new Error("No items provided");
  
  const weights: Record<string, number> = { common: 50, uncommon: 25, rare: 15, epic: 8, legendary: 2 };
  const totalWeight = items.reduce((sum, i) => sum + (weights[i.rarity] || 1), 0);
  
  let totalPayout = 0;
  const results: Array<{ item_name: string; value: number; roll: number }> = [];
  
  for (let r = 0; r < caseCount; r++) {
    const roll = await generateFloat(serverSeed, clientSeed, nonce, r);
    let cumWeight = 0;
    let wonItem = items[items.length - 1];
    for (const item of items) {
      cumWeight += (weights[item.rarity] || 1) / totalWeight;
      if (roll <= cumWeight) { wonItem = item; break; }
    }
    totalPayout += wonItem.value;
    results.push({ item_name: wonItem.name, value: wonItem.value, roll });
  }
  
  totalPayout = parseFloat(totalPayout.toFixed(2));
  
  return {
    outcome: { results, won: totalPayout > 0 },
    payout: totalPayout,
    multiplier: totalPayout / (actions.bet_amount || 1),
  };
}

const RESOLVERS: Record<string, (ss: string, cs: string, n: number, p: any, a: any) => Promise<any>> = {
  limbo: resolveLimbo,
  mines: resolveMines,
  plinko: resolvePlinko,
  crash: resolveCrash,
  wheel: resolveWheel,
  hilo: resolveHilo,
  keno: resolveKeno,
  cases: resolveCases,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const body = await req.json();
    const { session_id, actions } = body;

    if (!session_id || typeof session_id !== "string") {
      return new Response(JSON.stringify({ error: "Missing session_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Load session
    const { data: session, error: sessionError } = await adminClient
      .from("game_sessions")
      .select("*")
      .eq("id", session_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "Session not found or already resolved" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve game
    const resolver = RESOLVERS[session.game_type];
    if (!resolver) {
      return new Response(JSON.stringify({ error: "Unknown game type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gameResult = await resolver(
      session.server_seed,
      session.client_seed,
      session.nonce,
      session.game_params,
      { ...actions, bet_amount: session.bet_amount }
    );

    // Credit win if applicable
    if (gameResult.payout > 0) {
      await adminClient.rpc("credit_win", {
        win_amount: gameResult.payout,
        p_user_id: user.id,
      });
    }

    // Update session
    await adminClient
      .from("game_sessions")
      .update({
        status: "resolved",
        result: gameResult.outcome,
        payout: gameResult.payout,
      })
      .eq("id", session_id);

    return new Response(
      JSON.stringify({
        outcome: gameResult.outcome,
        payout: gameResult.payout,
        server_seed: session.server_seed,
        server_seed_hash: session.server_seed_hash,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
