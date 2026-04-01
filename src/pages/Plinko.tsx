import { useCallback, useEffect, useRef, useState } from "react";
import { useDemoMode } from "@/hooks/useDemoMode";
import { DemoToggle } from "@/components/DemoToggle";
import { playBetPlace, playCashout, playLimboLose, playPlinkoDink } from "@/lib/sounds";
import plinkoBg from "@/assets/plinko-bg.png";
import coinIcon from "@/assets/coin-icon.png";
import { generatePlinkoPath } from "@/lib/provablyFair";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { useGameSession } from "@/hooks/useGameSession";
import { FairnessInfo } from "@/components/FairnessInfo";
import { useBalance } from "@/hooks/useBalance";

/* ───── constants ───── */
type Risk = "low" | "medium" | "high" | "rain";

const MULTIPLIERS: Record<Risk, Record<number, number[]>> = {
  low: {
    8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    10: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
    12: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    14: [7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 7.1],
    16: [500, 42, 22, 4, 2, 2, 0.3, 0.2, 0.2, 0.2, 0.2, 0.3, 2, 2, 4, 22, 42, 500],
  },
  medium: {
    8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    10: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
    12: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    14: [43, 13, 6, 3, 1.3, 0.7, 0.4, 0.2, 0.4, 0.7, 1.3, 3, 6, 13, 43],
    16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
  },
  high: {
    8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    10: [76, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 76],
    12: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
    14: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420],
    16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
  rain: {
    8: [57, 7, 2, 0.1, 0.1, 0.1, 2, 7, 57],
    10: [150, 20, 5, 1.2, 0.1, 0.1, 0.1, 1.2, 5, 20, 150],
    12: [350, 50, 15, 3, 0.5, 0.1, 0.1, 0.1, 0.5, 3, 15, 50, 350],
    14: [800, 100, 30, 8, 2.5, 0.2, 0.1, 0.1, 0.1, 0.2, 2.5, 8, 30, 100, 800],
    16: [2000, 250, 50, 15, 6, 3, 0.1, 0.1, 0.1, 0.1, 0.1, 3, 6, 15, 50, 250, 2000],
  },
};

const ROW_OPTIONS = [8, 10, 12, 14, 16];

/* ───── physics ───── */
interface TrailPoint { x: number; y: number; }
interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  row: number;
  done: boolean;
  bucketIndex: number | null;
  path: number[];
  settled: boolean;
  bet: number;
  trail: TrailPoint[];
  nonce?: number; // Store the nonce used for this ball
}

const GRAVITY = 0.35;
const BALL_RADIUS = 5;
const TRAIL_LENGTH = 0; // Disabled trail
const BOUNCE_DAMPING = 0.75;
const FRICTION = 0.99;

let ballIdCounter = 0;

/* bucket bounce animation state */
const bucketBounceMap: Record<number, number> = {};

const Plinko = () => {
  const fairness = useProvablyFair();
  const gameSession = useGameSession("plinko");
  const { isDemo, toggleDemo } = useDemoMode();
  const { balance } = useBalance();
  const [betAmount, setBetAmount] = useState(1);
  const [risk, setRisk] = useState<Risk>("low");
  const [rows, setRows] = useState(16);
  const [autoBet, setAutoBet] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const animRef = useRef<number>(0);
  const [lastResults, setLastResults] = useState<{ multiplier: number; won: boolean }[]>([]);
  const [lastBuckets, setLastBuckets] = useState<{ multiplier: number; index: number }[]>([]);
  const multipliers = MULTIPLIERS[risk][rows] || MULTIPLIERS[risk][16];

  /* ── canvas dimensions ── */
  const PEG_GAP = 36;
  const TOP_PAD = 40;
  const canvasWidth = (rows + 2) * PEG_GAP;
  const canvasHeight = (rows + 1) * PEG_GAP + TOP_PAD + 50;

  const pegX = useCallback(
    (row: number, col: number) => {
      const pegsInRow = row + 3;
      const rowWidth = (pegsInRow - 1) * PEG_GAP;
      return (canvasWidth - rowWidth) / 2 + col * PEG_GAP;
    },
    [canvasWidth]
  );

  const pegY = useCallback(
    (row: number) => TOP_PAD + row * PEG_GAP,
    []
  );

  /* ── drop ball (provably fair) ── */
  const dropBall = useCallback(async () => {
    if (!isDemo) {
      const mults = multipliers;
      const sid = await gameSession.startGame(betAmount, { rows, risk, multipliers: mults });
      if (!sid) return;
      playBetPlace();
      const resolution = await gameSession.resolveGame({}, sid);
      if (!resolution) return;
      const path = resolution.outcome.path;
      let bucketIndex = 0;
      for (const dir of path) bucketIndex += dir;
      const ball: Ball = {
        id: ballIdCounter++, x: canvasWidth / 2 + (Math.random() - 0.5) * 10,
        y: -30, vx: (Math.random() - 0.5) * 0.5, vy: 0, row: 0, done: false,
        bucketIndex, path, settled: false, bet: betAmount, trail: [],
      };
      ballsRef.current.push(ball);
      return;
    }
    playBetPlace();
    
    // Use a simple counter to ensure uniqueness instead of relying on nonce
    const ballIndex = ballsRef.current.length;
    const currentNonce = fairness.nonce + ballIndex;
    console.log(`[PLINKO] Ball ${ballIndex} - Using nonce: ${currentNonce} (base: ${fairness.nonce})`);
    
    // Generate path with unique nonce
    const path = await generatePlinkoPath(fairness.serverSeed, fairness.clientSeed, currentNonce, rows);
    console.log(`[PLINKO] Generated path for nonce ${currentNonce}:`, path);
    
    let bucketIndex = 0;
    for (const dir of path) bucketIndex += dir;
    console.log(`[PLINKO] Ball will land in bucket: ${bucketIndex}`);
    
    const ball: Ball = {
      id: ballIdCounter++, x: canvasWidth / 2 + (Math.random() - 0.5) * 10,
      y: -30, vx: (Math.random() - 0.5) * 0.5, vy: 0, row: 0, done: false,
      bucketIndex, path, settled: false, bet: betAmount, trail: [],
      nonce: currentNonce,
    };
    ballsRef.current.push(ball);
    
    // Rotate seed after all balls are done (in a separate process)
    if (ballIndex === 0) {
      fairness.rotateSeed().then(() => {
        console.log(`[PLINKO] Seed rotation completed`);
      });
    }
  }, [canvasWidth, rows, fairness, betAmount, isDemo, gameSession, multipliers, risk]);

  /* ── handle tab visibility ── */
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        const balls = ballsRef.current;
        for (const ball of balls) {
          if (ball.settled) continue;
          ball.settled = true;
          ball.done = true;
          const bucketRow = rows - 1;
          const bucketYPos = pegY(bucketRow) + PEG_GAP * 0.5;
          let col = 0;
          for (const dir of ball.path) col += dir;
          ball.x = pegX(rows - 1, 0) + col * PEG_GAP;
          ball.y = bucketYPos;

          const mult = multipliers[ball.bucketIndex!];
          const won = mult >= 1;
          const payout = parseFloat((ball.bet * mult).toFixed(2));
          setLastResults((prev) => [{ multiplier: mult, won }, ...prev.slice(0, 19)]);

          setLastBuckets((prev) => [{ multiplier: mult, index: ball.bucketIndex! }, ...prev.slice(0, 7)]);

          if (payout > 0) {
            playCashout();
          } else {
            playLimboLose();
          }
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [rows, multipliers, pegX, pegY]);

  /* ── main render loop ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = canvasWidth + "px";
    canvas.style.height = canvasHeight + "px";
    const c = canvas.getContext("2d")!;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const PEG_RADIUS = 3.5;

    const loop = () => {
      c.clearRect(0, 0, canvasWidth, canvasHeight);

      for (let row = 0; row < rows; row++) {
        const pegsInRow = row + 3;
        for (let col = 0; col < pegsInRow; col++) {
          const px = pegX(row, col);
          const py = pegY(row);
          c.beginPath();
          c.arc(px, py, PEG_RADIUS, 0, Math.PI * 2);
          c.fillStyle = "rgba(255, 255, 255, 0.9)";
          c.fill();
          c.strokeStyle = "rgba(255, 255, 255, 0.6)";
          c.lineWidth = 0.5;
          c.stroke();
        }
      }

      const bucketCount = rows + 1;
      const mults = multipliers;
      const bucketY = pegY(rows) + PEG_GAP * 0.5;
      const bucketHeight = 46;
      const rad = 7;

      /* Use the LAST peg row (row = rows-1 has rows+2 pegs) to span buckets edge-to-edge */
      const lastRowPegCount = rows + 2;
      const leftmostPeg = pegX(rows - 1, 0);
      const rightmostPeg = pegX(rows - 1, lastRowPegCount - 1);
      const totalSpan = rightmostPeg - leftmostPeg + PEG_GAP;
      const bucketSpacing = totalSpan / bucketCount;
      const bucketWidth = bucketSpacing - 3;
      const startX = leftmostPeg - PEG_GAP / 2 + bucketSpacing / 2;

      for (let i = 0; i < bucketCount; i++) {
        const bx = startX + i * bucketSpacing;
        const mult = mults[i];
        
        /* Define colors based on multiplier values to match image */
        let bgColor, textColor, borderColor;
        
        if (mult >= 500) {
          // Purple for 500x
          bgColor = "hsl(280, 70%, 45%)";
          textColor = "#fff";
          borderColor = "hsl(280, 70%, 35%)";
        } else if (mult >= 22) {
          // Blue for 22x, 42x
          bgColor = "hsl(215, 80%, 55%)";
          textColor = "#fff";
          borderColor = "hsl(215, 80%, 45%)";
        } else if (mult >= 4) {
          // Blue for 4x
          bgColor = "hsl(215, 75%, 50%)";
          textColor = "#fff";
          borderColor = "hsl(215, 75%, 40%)";
        } else if (mult === 2) {
          // Orange for 2x
          bgColor = "hsl(25, 85%, 55%)";
          textColor = "#fff";
          borderColor = "hsl(25, 85%, 45%)";
        } else if (mult === 0.3) {
          // Light grey for 0.3x
          bgColor = "hsl(220, 15%, 75%)";
          textColor = "hsl(220, 15%, 25%)";
          borderColor = "hsl(220, 15%, 65%)";
        } else {
          // Light grey for 0.2x
          bgColor = "hsl(220, 15%, 70%)";
          textColor = "hsl(220, 15%, 25%)";
          borderColor = "hsl(220, 15%, 60%)";
        }

        /* Bounce animation offset */
        const bounceT = bucketBounceMap[i] || 0;
        const bounceOffset = bounceT > 0 ? Math.sin(bounceT * Math.PI) * (6 + Math.min(bounceT * 2, 4)) : 0; // Bigger bounce for multiple hits
        if (bounceT > 0) {
          bucketBounceMap[i] = Math.max(0, bounceT - 0.03); // Slower decay for longer animation
        }

        const x0 = bx - bucketWidth / 2;
        const baseY0 = bucketY - bucketHeight / 2;
        const y0 = baseY0 + bounceOffset;
        const cornerRad = 5;
        const slabHeight = 4;

        /* ── Bottom slab (darker base) ── */
        c.fillStyle = borderColor;
        c.beginPath();
        c.roundRect(x0, y0 + bucketHeight - slabHeight, bucketWidth, slabHeight + 1, [0, 0, cornerRad, cornerRad]);
        c.fill();

        /* ── Main face (flat solid color) ── */
        c.fillStyle = bgColor;
        c.beginPath();
        c.roundRect(x0, y0, bucketWidth, bucketHeight - slabHeight, [cornerRad, cornerRad, 0, 0]);
        c.fill();

        /* ── Text ── */
        const fontSize = bucketWidth < 26 ? 9 : bucketWidth < 34 ? 11 : 13;
        c.fillStyle = textColor;
        c.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        
        // Special handling for 2x bins that show "100" underneath
        if (mult === 2) {
          c.fillText("2x", bx, y0 + (bucketHeight - slabHeight) / 2 - 8);
          c.font = `600 ${fontSize - 2}px Inter, system-ui, sans-serif`;
          c.fillText("100", bx, y0 + (bucketHeight - slabHeight) / 2 + 4);
        } else {
          c.fillText(`${mult}x`, bx, y0 + (bucketHeight - slabHeight) / 2);
        }
      }

      const balls = ballsRef.current;
      for (const ball of balls) {
        if (ball.settled) continue;

        /* ── Trail ── */
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > TRAIL_LENGTH) ball.trail.shift();

        /* ── Physics with realistic collisions ── */
        ball.vy += GRAVITY;
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= FRICTION;

        // Check collision with pegs in current and nearby rows
        for (let checkRow = Math.max(0, Math.floor((ball.y - TOP_PAD) / PEG_GAP) - 1); 
             checkRow <= Math.min(rows - 1, Math.floor((ball.y - TOP_PAD) / PEG_GAP) + 1); 
             checkRow++) {
          const pegsInRow = checkRow + 3;
          for (let col = 0; col < pegsInRow; col++) {
            const currentPegX = pegX(checkRow, col);
            const currentPegY = pegY(checkRow);
            
            // Calculate distance between ball and peg
            const dx = ball.x - currentPegX;
            const dy = ball.y - currentPegY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if collision occurs
            if (distance < BALL_RADIUS + PEG_RADIUS) {
              // Calculate collision response
              const nx = dx / distance; // Normal vector x
              const ny = dy / distance; // Normal vector y
              
              // Separate balls to prevent overlap
              const overlap = BALL_RADIUS + PEG_RADIUS - distance;
              ball.x += nx * overlap;
              ball.y += ny * overlap;
              
              // Calculate relative velocity
              const relativeVelocity = ball.vx * nx + ball.vy * ny;
              
              // Only resolve if velocities are converging
              if (relativeVelocity < 0) {
                // Apply impulse with damping
                const impulse = 2 * relativeVelocity * BOUNCE_DAMPING;
                ball.vx -= impulse * nx;
                ball.vy -= impulse * ny;
                
                // Add some randomness for realistic bouncing
                ball.vx += (Math.random() - 0.5) * 0.8;
                ball.vy += (Math.random() - 0.5) * 0.4;
                
                playPlinkoDink(checkRow / rows);
              }
            }
          }
        }

        // Keep balls within game boundaries
        const leftBound = pegX(0, 0) - PEG_GAP * 0.5;
        const rightBound = pegX(0, 2) + PEG_GAP * 0.5;
        
        if (ball.x - BALL_RADIUS < leftBound) {
          ball.x = leftBound + BALL_RADIUS;
          ball.vx = Math.abs(ball.vx) * BOUNCE_DAMPING;
        }
        if (ball.x + BALL_RADIUS > rightBound) {
          ball.x = rightBound - BALL_RADIUS;
          ball.vx = -Math.abs(ball.vx) * BOUNCE_DAMPING;
        }

        const bucketYPos = pegY(rows - 1) + PEG_GAP * 0.5;
        if (ball.y >= bucketYPos && !ball.settled) {
          ball.settled = true;
          ball.done = true;
          console.log(`[PLINKO] Ball ${ball.id} settled in bucket ${ball.bucketIndex} with nonce ${ball.nonce}`);
          /* Trigger bucket bounce */
          if (ball.bucketIndex != null) {
            // Enhance bounce if already bouncing, or start new bounce
            const currentBounce = bucketBounceMap[ball.bucketIndex] || 0;
            bucketBounceMap[ball.bucketIndex] = Math.max(1, currentBounce + 0.3);
            console.log(`[PLINKO] Triggered bounce for bucket ${ball.bucketIndex}`);
          }
          const mult = multipliers[ball.bucketIndex!];
          const won = mult >= 1;
          const payout = parseFloat((ball.bet * mult).toFixed(2));

          setLastResults((prev) => [{ multiplier: mult, won }, ...prev.slice(0, 19)]);

          setLastBuckets((prev) => [{ multiplier: mult, index: ball.bucketIndex! }, ...prev.slice(0, 7)]);

          if (payout > 0) {
            playCashout();
          } else {
            playLimboLose();
          }
        }

        /* ── Draw ball ── */
        if (ball.y > -BALL_RADIUS) {
          c.beginPath();
          c.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
          const gradient = c.createRadialGradient(
            ball.x - 1.5, ball.y - 1.5, 0.5,
            ball.x, ball.y, BALL_RADIUS
          );
          gradient.addColorStop(0, "#ffffff");
          gradient.addColorStop(0.7, "#e8e8e8");
          gradient.addColorStop(1, "#c0c0c0");
          c.fillStyle = gradient;
          c.fill();
          c.strokeStyle = "rgba(255,255,255,0.3)";
          c.lineWidth = 0.5;
          c.stroke();
        }
      }

      const bucketYPos = pegY(rows - 1) + PEG_GAP * 0.5;
      ballsRef.current = balls.filter((b) => !b.settled || b.y < bucketYPos + 40);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [canvasWidth, canvasHeight, rows, multipliers, pegX, pegY, isDemo, fairness]);

  /* ── auto bet ── */
  const autoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [autoRunning, setAutoRunning] = useState(false);

  const startAuto = useCallback(() => {
    if (autoBet <= 0) return;
    setAutoRunning(true);
    let count = 0;
    console.log(`[PLINKO AUTO] Starting autobet with ${autoBet} balls`);
    autoIntervalRef.current = setInterval(() => {
      console.log(`[PLINKO AUTO] Ball ${count + 1} - Current nonce before drop: ${fairness.nonce}`);
      dropBall();
      count++;
      if (count >= autoBet) {
        clearInterval(autoIntervalRef.current!);
        setAutoRunning(false);
        console.log(`[PLINKO AUTO] Autobet completed`);
      }
    }, 400);
  }, [autoBet, dropBall]);

  useEffect(() => {
    return () => {
      if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);
    };
  }, []);

  const displaySeedHash = isDemo ? fairness.serverSeedHash : gameSession.serverSeedHash;
  const displayClientSeed = isDemo ? fairness.clientSeed : gameSession.clientSeed;
  const displayNonce = isDemo ? fairness.nonce : gameSession.nonce;
  const displayVerification = isDemo ? fairness.lastVerification : gameSession.lastVerification;
  const handleClientSeedChange = isDemo ? fairness.updateClientSeed : gameSession.updateClientSeed;

  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-foreground tracking-tight">Plinko</h1>
          <DemoToggle isDemo={isDemo} onToggle={toggleDemo} />
        </div>
        <FairnessInfo
          serverSeedHash={displaySeedHash}
          clientSeed={displayClientSeed}
          nonce={displayNonce}
          lastVerification={displayVerification}
          onClientSeedChange={handleClientSeedChange}
          gameName="Plinko"
        />
      </div>

      {lastResults.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {lastResults.map((entry, i) => (
            <div
              key={i}
              className="animate-fade-in"
              style={{
                padding: "6px 14px",
                borderRadius: "4px",
                fontSize: "13px",
                fontWeight: 800,
                color: entry.won ? "hsl(142 80% 65%)" : "hsl(0 0% 100%)",
                background: entry.won
                  ? "linear-gradient(180deg, hsl(142 50% 22%), hsl(142 45% 16%))"
                  : "linear-gradient(180deg, hsl(222 25% 22%), hsl(222 28% 17%))",
                border: `1px solid ${entry.won ? "hsl(142 40% 30%)" : "hsl(222 20% 26%)"}`,
                boxShadow: entry.won
                  ? "0 2px 8px hsl(142 50% 15% / 0.4)"
                  : "0 2px 8px hsl(222 30% 8% / 0.4)",
              }}
            >
              {entry.multiplier}×
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5">
        <div className="game-panel space-y-5">
          <div>
            <label className="game-label">Bet Amount</label>
            <div className="game-input-grid">
              <div className="game-input flex items-center gap-1">
                <span className="text-muted-foreground font-bold">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(0.01, Number(e.target.value) || 0.01))}
                  className="bg-transparent outline-none w-full text-foreground"
                />
              </div>
              <button type="button" onClick={() => setBetAmount((v) => Math.max(0.01, parseFloat((v / 2).toFixed(2))))} className="game-mini-btn">½</button>
              <button type="button" onClick={() => setBetAmount((v) => parseFloat((v * 2).toFixed(2)))} className="game-mini-btn">2x</button>
            </div>
          </div>

          <div>
            <label className="game-label">Risk Level</label>
            <div className="game-segmented" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              {(["low", "medium", "high", "rain"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRisk(r)}
                  className={`game-segment ${risk === r ? (r === "rain" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "game-segment-active") : "game-segment-idle"}`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="game-label">Rows</label>
            <div className="game-slider-shell">
              <div className="flex items-center gap-3">
                <div className="game-count-pill min-w-[3.5rem]">{rows}</div>
                <input
                  type="range"
                  min={8}
                  max={16}
                  step={2}
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="game-range flex-1"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) ${((rows - 8) / 8) * 100}%, hsl(var(--secondary)) ${((rows - 8) / 8) * 100}%)`,
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="game-label">Auto Bet</label>
            <div className="game-slider-shell">
              <div className="flex items-center gap-3">
                <div className="game-count-pill min-w-[3.5rem]">{autoBet}</div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={autoBet}
                  onChange={(e) => setAutoBet(Number(e.target.value))}
                  className="game-range flex-1"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) ${autoBet}%, hsl(var(--secondary)) ${autoBet}%)`,
                  }}
                />
              </div>
            </div>
          </div>

          {autoBet > 0 ? (
            <button
              onClick={autoRunning ? () => {
                clearInterval(autoIntervalRef.current!);
                setAutoRunning(false);
              } : startAuto}
              className={autoRunning ? "game-cashout-btn" : "game-gold-btn"}
            >
              {autoRunning ? "STOP AUTO" : `AUTO DROP (${autoBet})`}
            </button>
          ) : (
            <button onClick={dropBall} className="game-gold-btn">
              PLACE BET
            </button>
          )}

        </div>

        <div
          className="game-panel relative flex items-center justify-center overflow-hidden"
          style={{ background: "linear-gradient(135deg, hsl(230 35% 25%), hsl(230 40% 20%))" }}
        >
          <canvas
            ref={canvasRef}
            className="relative z-10"
            style={{ imageRendering: "auto", maxWidth: "100%" }}
          />

          {/* Last buckets sidebar */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {lastBuckets.map((bucket, i) => {
              let bgColor, textColor;
              if (bucket.multiplier >= 2) {
                bgColor = "#fbbf24";
                textColor = "#000";
              } else if (bucket.multiplier >= 1) {
                bgColor = "#fcd34d";
                textColor = "#000";
              } else {
                bgColor = "#fb923c";
                textColor = "#000";
              }
              
              return (
                <div
                  key={i}
                  className="rounded px-3 py-2 text-sm font-bold animate-in slide-in-from-right duration-300"
                  style={{
                    background: bgColor,
                    color: textColor,
                    animationDelay: `${i * 50}ms`,
                    minWidth: "60px",
                    textAlign: "center"
                  }}
                >
                  {bucket.multiplier}x
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plinko;
