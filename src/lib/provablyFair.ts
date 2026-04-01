/**
 * Client-side Provably Fair system
 *
 * Flow:
 * 1. A "server seed" is generated and its SHA-256 hash is shown BEFORE the bet.
 * 2. The user has a "client seed" they can change at any time.
 * 3. Each bet increments a nonce.
 * 4. The game result is derived from HMAC-SHA256(serverSeed, clientSeed:nonce).
 * 5. After a bet, the server seed is revealed so the user can verify.
 *    A new server seed is generated for the next bet.
 */

// ─── Hashing utilities (Web Crypto API) ───

async function sha256(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Seed generation ───

export function generateSeed(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashSeed(seed: string): Promise<string> {
  return sha256(seed);
}

// ─── Result derivation ───

/**
 * Generates a float [0, 1) from HMAC-SHA256(serverSeed, clientSeed:nonce).
 * Uses the first 8 hex chars (4 bytes / 32 bits) for precision.
 */
export async function generateFloat(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  cursor: number = 0
): Promise<number> {
  const message = `${clientSeed}:${nonce}:${cursor}`;
  const hash = await hmacSha256(serverSeed, message);
  // Take 8 hex chars = 4 bytes = 32-bit integer
  const int = parseInt(hash.slice(0, 8), 16);
  return int / 0x100000000; // Divide by 2^32
}

/**
 * Generates multiple floats from a single hash by using different cursors.
 */
export async function generateFloats(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  count: number
): Promise<number[]> {
  const floats: number[] = [];
  for (let i = 0; i < count; i++) {
    floats.push(await generateFloat(serverSeed, clientSeed, nonce, i));
  }
  return floats;
}

// ─── Game-specific result generators ───

/** Limbo: returns a multiplier >= 1.00 with 1% house edge */
export async function generateLimboResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<number> {
  const float = await generateFloat(serverSeed, clientSeed, nonce);
  const edge = 0.99;
  return Math.max(1.0, parseFloat((edge / float).toFixed(2)));
}

/** Mines: returns a set of mine positions */
export async function generateMinePositions(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  totalTiles: number,
  mineCount: number
): Promise<Set<number>> {
  const positions = new Set<number>();
  let cursor = 0;
  while (positions.size < mineCount) {
    const float = await generateFloat(serverSeed, clientSeed, nonce, cursor);
    const pos = Math.floor(float * totalTiles);
    positions.add(pos);
    cursor++;
  }
  return positions;
}

/** Keno: returns drawn number positions (1-indexed) */
export async function generateKenoDrawn(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  totalNumbers: number,
  drawCount: number
): Promise<Set<number>> {
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
  return drawn;
}

/** Plinko: returns an array of 0|1 directions for each row */
export async function generatePlinkoPath(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  rows: number
): Promise<number[]> {
  const floats = await generateFloats(serverSeed, clientSeed, nonce, rows);
  return floats.map((f) => (f < 0.5 ? 0 : 1));
}

/** Cases: returns a float [0, 1) used for weighted item selection */
export async function generateCaseRoll(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<number> {
  return generateFloat(serverSeed, clientSeed, nonce);
}

// ─── Verification ───

export interface VerificationData {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

/**
 * Verifies that a server seed matches its previously shown hash
 */
export async function verifySeedHash(serverSeed: string, expectedHash: string): Promise<boolean> {
  const hash = await sha256(serverSeed);
  return hash === expectedHash;
}
