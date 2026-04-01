import { useCallback, useState, useMemo } from "react";
import { useDemoMode } from "@/hooks/useDemoMode";
import { DemoToggle } from "@/components/DemoToggle";
import coinIcon from "@/assets/coin-icon.png";
import diamondImage from "@/assets/keno-diamond copy 2.svg";
import { playBetPlace, playCashout, playKenoSelect, playKenoDeselect, playKenoHit, playKenoMiss } from "@/lib/sounds";
import { generateKenoDrawn } from "@/lib/provablyFair";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { useGameSession } from "@/hooks/useGameSession";
import { FairnessInfo } from "@/components/FairnessInfo";
import { useBalance } from "@/hooks/useBalance";

type Risk = "classic" | "low" | "medium" | "high";
type Mode = "manual" | "auto";

const TOTAL_NUMBERS = 40;
const MAX_PICKS = 10;
const DRAW_COUNT = 10;

const PAYOUTS: Record<Risk, Record<number, number[]>> = {
  classic: {
    1: [0, 2.5], 2: [0, 1.5, 4], 3: [0, 1, 1.5, 6], 4: [0, 0.5, 1.5, 3, 10],
    5: [0, 0.5, 1, 2, 5, 18], 6: [0, 0, 1, 1.5, 3, 8, 30], 7: [0, 0, 0.5, 1.5, 2, 5, 12, 50],
    8: [0, 0, 0.5, 1, 2, 3, 8, 20, 80], 9: [0, 0, 0, 1, 1.5, 2, 5, 12, 35, 100],
    10: [0, 0, 0, 0.5, 1, 2, 3, 8, 20, 50, 150],
  },
  low: {
    1: [0, 2.5], 2: [0, 1.5, 4], 3: [0, 1, 1.5, 6], 4: [0, 0.5, 1.5, 3, 10],
    5: [0, 0.5, 1, 2, 5, 18], 6: [0, 0, 1, 1.5, 3, 8, 30], 7: [0, 0, 0.5, 1.5, 2, 5, 12, 50],
    8: [0, 0, 0.5, 1, 2, 3, 8, 20, 80], 9: [0, 0, 0, 1, 1.5, 2, 5, 12, 35, 100],
    10: [0, 0, 0, 0.5, 1, 2, 3, 8, 20, 50, 150],
  },
  medium: {
    1: [0, 3.5], 2: [0, 1.5, 6], 3: [0, 1, 2, 12], 4: [0, 0.5, 2, 5, 20],
    5: [0, 0.5, 1.5, 3, 10, 40], 6: [0, 0, 1, 2, 5, 15, 70], 7: [0, 0, 0.5, 2, 3, 8, 25, 100],
    8: [0, 0, 0, 1.5, 2, 5, 12, 40, 200], 9: [0, 0, 0, 1, 1.5, 3, 8, 20, 80, 300],
    10: [0, 0, 0, 0.5, 1, 2, 5, 15, 50, 150, 500],
  },
  high: {
    1: [0, 5], 2: [0, 2, 10], 3: [0, 1, 3, 25], 4: [0, 0.5, 2, 8, 50],
    5: [0, 0, 1.5, 5, 20, 100], 6: [0, 0, 1, 3, 8, 30, 200], 7: [0, 0, 0.5, 2, 5, 15, 60, 400],
    8: [0, 0, 0, 1.5, 3, 8, 25, 80, 600], 9: [0, 0, 0, 1, 2, 5, 15, 50, 150, 1000],
    10: [0, 0, 0, 0.5, 1.5, 3, 8, 30, 100, 400, 2000],
  },
};

const Keno = () => {
  const fairness = useProvablyFair();
  const gameSession = useGameSession("keno");
  const { isDemo, toggleDemo } = useDemoMode();
  const { balance } = useBalance();
  const [mode, setMode] = useState<Mode>("manual");
  const [betAmount, setBetAmount] = useState(1);
  const [risk, setRisk] = useState<Risk>("classic");
  const [picks, setPicks] = useState<Set<number>>(new Set());
  const [drawnNumbers, setDrawnNumbers] = useState<Set<number>>(new Set());
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<{ hits: number; payout: number; multiplier: number } | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [revealedDrawn, setRevealedDrawn] = useState<Set<number>>(new Set());

  const togglePick = useCallback(
    (num: number) => {
      if (playing) return;
      setPicks((prev) => {
        const next = new Set(prev);
        if (next.has(num)) {
          next.delete(num);
          playKenoDeselect();
        } else if (next.size < MAX_PICKS) {
          next.add(num);
          playKenoSelect();
        }
        return next;
      });
      setDrawnNumbers(new Set());
      setResult(null);
      setRevealedDrawn(new Set());
      setRevealIndex(0);
    },
    [playing]
  );

  const autoPick = useCallback(() => {
    if (playing) return;
    const pool = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
    const selected = new Set<number>();
    while (selected.size < MAX_PICKS) {
      const idx = Math.floor(Math.random() * pool.length);
      selected.add(pool[idx]);
      pool.splice(idx, 1);
    }
    setPicks(selected);
    playKenoSelect();
    setDrawnNumbers(new Set());
    setResult(null);
    setRevealedDrawn(new Set());
    setRevealIndex(0);
  }, [playing]);

  const clearTable = useCallback(() => {
    if (playing) return;
    setPicks(new Set());
    setDrawnNumbers(new Set());
    setResult(null);
    setRevealedDrawn(new Set());
    setRevealIndex(0);
  }, [playing]);

  const placeBetAction = useCallback(async () => {
    if (picks.size === 0 || playing) return;

    const payoutTable = PAYOUTS[risk][picks.size];
    let drawn: Set<number>;

    if (isDemo) {
      playBetPlace();
      setPlaying(true);
      setResult(null);
      setRevealedDrawn(new Set());
      setRevealIndex(0);
      drawn = await generateKenoDrawn(fairness.serverSeed, fairness.clientSeed, fairness.nonce, TOTAL_NUMBERS, DRAW_COUNT);
    } else {
      const sid = await gameSession.startGame(betAmount, {
        total_numbers: TOTAL_NUMBERS,
        draw_count: DRAW_COUNT,
        risk,
        payout_table: payoutTable,
      });
      if (!sid) return;

      playBetPlace();
      setPlaying(true);
      setResult(null);
      setRevealedDrawn(new Set());
      setRevealIndex(0);

      const resolution = await gameSession.resolveGame({
        picks: Array.from(picks),
      }, sid);

      if (!resolution) {
        setPlaying(false);
        return;
      }

      drawn = new Set(resolution.outcome.drawn as number[]);
    }

    setDrawnNumbers(drawn);

    const drawnArr = Array.from(drawn);
    let currentIndex = 0;
    const currentBet = betAmount;

    const revealNext = () => {
      if (currentIndex >= drawnArr.length) {
        const hits = Array.from(picks).filter((n) => drawn.has(n)).length;
        const multiplier = payoutTable ? payoutTable[hits] || 0 : 0;
        const payout = parseFloat((currentBet * multiplier).toFixed(2));
        setResult({ hits, payout, multiplier });
        if (payout > 0) {
          playCashout();
        }
        setPlaying(false);
        if (isDemo) fairness.rotateSeed();
        return;
      }

      const currentNum = drawnArr[currentIndex];
      const isHit = picks.has(currentNum);
      if (isHit) playKenoHit();
      else playKenoMiss();

      setRevealedDrawn((prev) => {
        const next = new Set(prev);
        next.add(currentNum);
        return next;
      });
      setRevealIndex(currentIndex + 1);
      currentIndex++;
      setTimeout(revealNext, 120);
    };

    setTimeout(revealNext, 200);
  }, [picks, playing, risk, betAmount, fairness, isDemo, gameSession]);

  const getNumberState = useCallback(
    (num: number) => {
      const isPicked = picks.has(num);
      const isDrawn = revealedDrawn.has(num);
      if (isPicked && isDrawn) return "hit";
      if (!isPicked && isDrawn) return "miss";
      if (isPicked) return "picked";
      return "idle";
    },
    [picks, revealedDrawn]
  );

  const numbers = useMemo(
    () => Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1),
    []
  );

  const displaySeedHash = isDemo ? fairness.serverSeedHash : gameSession.serverSeedHash;
  const displayClientSeed = isDemo ? fairness.clientSeed : gameSession.clientSeed;
  const displayNonce = isDemo ? fairness.nonce : gameSession.nonce;
  const displayVerification = isDemo ? fairness.lastVerification : gameSession.lastVerification;
  const handleClientSeedChange = isDemo ? fairness.updateClientSeed : gameSession.updateClientSeed;

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-foreground tracking-tight">Keno</h1>
            <DemoToggle isDemo={isDemo} onToggle={toggleDemo} />
          </div>
          <FairnessInfo
            serverSeedHash={displaySeedHash}
            clientSeed={displayClientSeed}
            nonce={displayNonce}
            lastVerification={displayVerification}
            onClientSeedChange={handleClientSeedChange}
            disabled={playing}
            gameName="Keno"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[400px_minmax(0,1fr)] gap-6">
          <div className="game-panel space-y-5">
            <div className="game-segmented game-segmented-2">
              {(["manual", "auto"] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className={`game-segment ${mode === value ? "game-segment-active" : "game-segment-idle"}`}
                  type="button"
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
                <button type="button" onClick={() => setBetAmount((v) => Math.max(0.01, parseFloat((v / 2).toFixed(2))))} disabled={playing} className="game-mini-btn">½</button>
                <button type="button" onClick={() => setBetAmount((v) => parseFloat((v * 2).toFixed(2)))} disabled={playing} className="game-mini-btn">2x</button>
              </div>
            </div>

            <div>
              <label className="game-label">Risk</label>
              <div className="game-segmented" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                {(["classic", "low", "medium", "high"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRisk(r)}
                    disabled={playing}
                    className={`game-segment ${risk === r ? "game-segment-active" : "game-segment-idle"}`}
                  >
                    {r === "classic" ? "Classic" : r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={autoPick} disabled={playing} className="game-btn-outline">
                Auto Pick
              </button>
              <button onClick={clearTable} disabled={playing} className="game-btn-outline">
                Clear Table
              </button>
            </div>

            <button onClick={placeBetAction} disabled={playing || picks.size === 0} className="game-gold-btn">
              PLACE BET
            </button>

            {!isDemo && (
              <div className="text-center py-3 text-sm font-medium text-white/40">
                Enter a bet amount to start real play
              </div>
            )}
          </div>

          <div
            className="relative flex items-center justify-center overflow-hidden"
            style={{ 
              background: "linear-gradient(135deg, hsl(230 35% 25%), hsl(230 40% 20%))",
              border: "1px solid hsl(230 40% 30%)",
              borderRadius: "0",
              padding: "40px 20px"
            }}
          >

            <div className="relative z-10 w-full max-w-[1200px]">
              <div className="grid grid-cols-8" style={{ gap: "5px" }}>
                {numbers.map((num) => {
                  const state = getNumberState(num);
                  const isHit = state === "hit";
                  const isMiss = state === "miss";
                  const isPicked = state === "picked";

                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => togglePick(num)}
                      disabled={playing && !picks.has(num)}
                      className="relative font-bold text-lg flex items-center justify-center select-none cursor-pointer transition-all duration-200"
                      style={{
                        aspectRatio: "1/1",
                        borderRadius: "4px",
                        background: isHit
                          ? "linear-gradient(180deg, #2dd36f 0%, #1a9f4a 100%)"
                          : isMiss
                            ? "#3a3a6a"
                            : isPicked
                              ? "#4a4a8a"
                              : "linear-gradient(145deg, #2D336B, #252954)",
                        boxShadow: isHit
                          ? "0 4px 0 #147a36, 0 6px 12px rgba(45,211,111,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
                          : isMiss
                            ? "0 4px 0 #2a2a4a, 0 6px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)"
                            : isPicked
                              ? "0 4px 0 #3a3a6a, 0 6px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)"
                              : "0 4px 0 #1a1d3a, 0 6px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                        color: isHit
                          ? "#fff"
                          : isMiss
                            ? "rgba(255,255,255,0.4)"
                            : isPicked
                              ? "#fff"
                              : "#fff",
                        fontFamily: "Inter, system-ui, sans-serif",
                        padding: 0,
                        margin: 0,
                        border: "none",
                      }}
                    >
                      {isHit ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <img 
                              src={diamondImage} 
                              alt="diamond" 
                              className="w-full h-full object-cover animate-in zoom-in-95 duration-300"
                              style={{
                                animation: "hit-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
                              }}
                            />
                          </div>
                          <span className="relative text-white font-black text-lg drop-shadow-lg z-10 animate-bounce-in">{num}</span>
                        </div>
                      ) : (
                        <span className="font-bold">{num}</span>
                      )}
                  </button>
                );
              })}
              </div>

              <div className="text-center py-3 text-sm font-medium text-white/40 mt-4">
                Select 1 - {MAX_PICKS} numbers to play
              </div>
            </div>

            {result && result.payout > 0 && (
              <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-sm" onClick={() => setResult(null)}>
                <div
                  className="flex flex-col items-center gap-1 px-10 py-6 rounded-lg border-2 border-white/20 animate-in zoom-in-90 fade-in duration-300"
                  style={{
                    background: "linear-gradient(145deg, #1a1d3a, #0f1126)",
                    boxShadow: "0 0 30px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)",
                    borderBottom: "2px solid #22c55e"
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="rounded-lg px-4 py-2 border border-white/10 mb-2" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <span className="text-4xl font-black tracking-tight text-green-400" style={{ textShadow: "0 0 20px rgba(34,197,94,0.3)" }}>
                      {result.multiplier}x
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold text-green-300">
                      {isDemo ? "Demo Mode" : `$${result.payout.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Keno;
