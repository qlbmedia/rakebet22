import { useCallback, useEffect, useRef, useState } from "react";
import { useDemoMode } from "@/hooks/useDemoMode";
import { DemoToggle } from "@/components/DemoToggle";

import limboBg from "@/assets/limbo-bg.jpg";
import { playBetPlace, playLimboLose, playLimboTick, playLimboWin } from "@/lib/sounds";
import { generateLimboResult } from "@/lib/provablyFair";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { useGameSession } from "@/hooks/useGameSession";
import { FairnessInfo } from "@/components/FairnessInfo";
import { useBalance } from "@/hooks/useBalance";

const QUICK_TARGETS = [1.5, 2, 5, 10];
type Mode = "manual" | "auto";

function winChance(target: number): number {
  return Math.min(99, parseFloat(((0.99 / target) * 100).toFixed(2)));
}

interface HistoryEntry {
  target: number;
  result: number;
  won: boolean;
  bet: number;
  payout: number;
}

const Limbo = () => {
  const fairness = useProvablyFair();
  const gameSession = useGameSession("limbo");
  const { isDemo, toggleDemo } = useDemoMode();
  const { balance } = useBalance();
  const [mode, setMode] = useState<Mode>("manual");
  const [betAmount, setBetAmount] = useState(1);
  const [targetMultiplier, setTargetMultiplier] = useState(2);
  const [currentDisplay, setCurrentDisplay] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<{ result: number; won: boolean } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const pendingResultRef = useRef<{ result: number; target: number; bet: number } | null>(null);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && pendingResultRef.current) {
        const { result, target, bet } = pendingResultRef.current;
        pendingResultRef.current = null;
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        setCurrentDisplay(result);
        const won = result >= target;
        if (won) {
          playLimboWin();
        } else {
          playLimboLose();
        }
        setLastResult({ result, won });
        setHistory((prev) => [
          { target, result, won, bet, payout: won ? parseFloat((bet * target).toFixed(2)) : 0 },
          ...prev.slice(0, 19),
        ]);
        setPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const play = useCallback(async () => {
    if (playing) return;

    let result: number;

    if (isDemo) {
      playBetPlace();
      setPlaying(true);
      setLastResult(null);
      result = await generateLimboResult(fairness.serverSeed, fairness.clientSeed, fairness.nonce);
    } else {
      // Start server session
      const sid = await gameSession.startGame(betAmount, {});
      if (!sid) return;
      
      playBetPlace();
      setPlaying(true);
      setLastResult(null);
      
      // Resolve immediately — server computes result
      const resolution = await gameSession.resolveGame({
        target_multiplier: targetMultiplier,
      }, sid);
      
      if (!resolution) {
        setPlaying(false);
        return;
      }
      
      result = resolution.outcome.result;
    }

    pendingResultRef.current = { result, target: targetMultiplier, bet: betAmount };
    const displayTarget = Math.min(result, targetMultiplier + Math.random() * 2);
    const duration = 1200;
    let lastTick = 0;

    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = 1 + (displayTarget - 1) * eased;
      setCurrentDisplay(parseFloat(current.toFixed(2)));

      const tickInterval = Math.max(30, 150 - progress * 120);
      if (now - lastTick > tickInterval) {
        playLimboTick();
        lastTick = now;
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      pendingResultRef.current = null;
      setCurrentDisplay(result);
      const won = result >= targetMultiplier;
      if (won) {
        playLimboWin();
      } else {
        playLimboLose();
      }

      setLastResult({ result, won });
      setHistory((prev) => [
        {
          target: targetMultiplier,
          result,
          won,
          bet: betAmount,
          payout: won ? parseFloat((betAmount * targetMultiplier).toFixed(2)) : 0,
        },
        ...prev.slice(0, 19),
      ]);
      setPlaying(false);
      if (isDemo) fairness.rotateSeed();
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [betAmount, playing, targetMultiplier, fairness, isDemo, gameSession]);

  useEffect(() => () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  const chance = winChance(targetMultiplier);
  const potentialWin = parseFloat((betAmount * targetMultiplier).toFixed(2));

  const displaySeedHash = isDemo ? fairness.serverSeedHash : gameSession.serverSeedHash;
  const displayClientSeed = isDemo ? fairness.clientSeed : gameSession.clientSeed;
  const displayNonce = isDemo ? fairness.nonce : gameSession.nonce;
  const displayVerification = isDemo ? fairness.lastVerification : gameSession.lastVerification;
  const handleClientSeedChange = isDemo ? fairness.updateClientSeed : gameSession.updateClientSeed;

  return (
    <>
      <div className="p-4 md:p-6 max-w-[1040px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-foreground tracking-tight">Limbo</h1>
            <DemoToggle isDemo={isDemo} onToggle={toggleDemo} />
          </div>
          <FairnessInfo
            serverSeedHash={displaySeedHash}
            clientSeed={displayClientSeed}
            nonce={displayNonce}
            lastVerification={displayVerification}
            onClientSeedChange={handleClientSeedChange}
            disabled={playing}
            gameName="Limbo"
          />
        </div>

        {/* History at top */}
        {history.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {history.map((entry, index) => (
              <div
                key={index}
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
                {entry.result.toFixed(2)}×
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5">
          <div className="game-panel space-y-5">
            <div className="game-segmented game-segmented-2">
              {(["manual", "auto"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`game-segment ${mode === value ? "game-segment-active" : "game-segment-idle"}`}
                >
                  {value === "manual" ? "Manual" : "Auto"}
                </button>
              ))}
            </div>

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
                    disabled={playing}
                    className="bg-transparent outline-none w-full text-foreground"
                  />
                </div>
                <button type="button" onClick={() => setBetAmount((value) => Math.max(0.01, parseFloat((value / 2).toFixed(2))))} disabled={playing} className="game-mini-btn">
                  ½
                </button>
                <button type="button" onClick={() => setBetAmount((value) => parseFloat((value * 2).toFixed(2)))} disabled={playing} className="game-mini-btn">
                  2x
                </button>
              </div>
            </div>

            <div>
              <label className="game-label">Target Multiplier</label>
              <input
                type="number"
                step="0.1"
                min="1.01"
                max="1000"
                value={targetMultiplier}
                onChange={(e) => setTargetMultiplier(Math.max(1.01, Number(e.target.value) || 1.01))}
                disabled={playing}
                className="game-input"
              />
              <div className="game-segmented game-segmented-4 mt-3">
                {QUICK_TARGETS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => !playing && setTargetMultiplier(value)}
                    className={`game-segment ${targetMultiplier === value ? "game-segment-active" : "game-segment-idle"}`}
                    disabled={playing}
                  >
                    {value}x
                  </button>
                ))}
              </div>
            </div>

            <div className="game-stat-grid">
              <div className="game-stat">
                <p className="game-stat-label">Win Chance</p>
                <p className="game-stat-value">{chance}%</p>
              </div>
              <div className="game-stat">
                <p className="game-stat-label">Payout</p>
                <p className="game-stat-value">${potentialWin.toFixed(2)}</p>
              </div>
            </div>

            <button onClick={play} disabled={playing} className="game-gold-btn disabled:opacity-50">
              {playing ? "ROLLING..." : "PLACE BET"}
            </button>

          </div>

          <div className="game-panel min-h-[420px] flex flex-col items-center justify-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, hsl(230 35% 25%), hsl(230 40% 20%))" }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 50%, transparent 34%, hsl(230 40% 10% / 0.62) 100%)" }} />

            <div className="relative z-10 text-center px-4">
              <p
                className={`font-black transition-all duration-150 ${
                  playing
                    ? "text-6xl md:text-8xl text-foreground animate-pulse"
                    : lastResult
                      ? lastResult.won
                        ? "text-7xl md:text-9xl animate-limbo-win"
                        : "text-7xl md:text-9xl text-destructive animate-limbo-lose"
                      : "text-6xl md:text-8xl text-muted-foreground/30"
                }`}
                style={lastResult?.won && !playing ? { color: "hsl(142 70% 55%)" } : undefined}
              >
                {playing ? currentDisplay.toFixed(2) : lastResult ? lastResult.result.toFixed(2) : "0.00"}x
              </p>

            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Limbo;
