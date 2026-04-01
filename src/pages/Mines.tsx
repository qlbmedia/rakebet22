import { useCallback, useMemo, useRef, useState } from "react";
import { useDemoMode } from "@/hooks/useDemoMode";
import { DemoToggle } from "@/components/DemoToggle";

import { ICONS } from "@/assets/game-icons";
import bombImg from "@/assets/bomb.webp";
import gemImg from "@/assets/gem.webp";
import minesBg from "@/assets/mines-bg-new.png";
import coinIcon from "@/assets/coin-icon.png";
import { Button } from "@/components/ui/button";
import { playBetPlace, playCashout, playGemRevealChain, playMineExplosion } from "@/lib/sounds";
import { generateMinePositions } from "@/lib/provablyFair";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { useGameSession } from "@/hooks/useGameSession";
import { FairnessInfo } from "@/components/FairnessInfo";
import { useBalance } from "@/hooks/useBalance";

const GRID_OPTIONS = [25, 36, 49, 64] as const;
const MIN_MINES = 1;

type Mode = "manual" | "auto";

interface TileState {
  revealed: boolean;
  isMine: boolean;
}

function getGridSize(total: number): number {
  return Math.round(Math.sqrt(total));
}

function getMaxMines(total: number): number {
  return total - 1;
}

const createTiles = (total: number): TileState[] =>
  Array.from({ length: total }, () => ({
    revealed: false,
    isMine: false,
  }));

function getMultiplier(mines: number, revealed: number, totalTiles: number): number {
  if (revealed === 0) return 1;
  let mult = 1;
  for (let i = 0; i < revealed; i += 1) {
    mult *= totalTiles - i;
    mult /= totalTiles - mines - i;
  }
  return Math.max(1, parseFloat(mult.toFixed(2)));
}

const Mines = () => {
  const fairness = useProvablyFair();
  const gameSession = useGameSession("mines");
  const { isDemo, toggleDemo } = useDemoMode();
  const { balance, placeBet: realPlaceBet } = useBalance();
  const [mode, setMode] = useState<Mode>("manual");
  const [gridTotal, setGridTotal] = useState<number>(25);
  const [mineCount, setMineCount] = useState(8);
  const [betAmount, setBetAmount] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [tiles, setTiles] = useState<TileState[]>(() => createTiles(25));
  const [revealedCount, setRevealedCount] = useState(0);
  const [minePositions, setMinePositions] = useState<Set<number>>(new Set());
  const [shakeGrid, setShakeGrid] = useState(false);
  const gemsFoundRef = useRef(0);
  const betRef = useRef(0);
  const revealedTilesRef = useRef<number[]>([]);

  const gridSize = getGridSize(gridTotal);
  const maxMines = getMaxMines(gridTotal);

  const effectiveMineCount = Math.min(mineCount, maxMines);

  const multiplier = getMultiplier(effectiveMineCount, revealedCount, gridTotal);
  const potentialCashout = parseFloat((betAmount * multiplier).toFixed(2));
  const sliderFill = useMemo(
    () => ((effectiveMineCount - MIN_MINES) / (maxMines - MIN_MINES)) * 100,
    [effectiveMineCount, maxMines]
  );

  const handleGridChange = useCallback((total: number) => {
    if (playing) return;
    setGridTotal(total);
    setMineCount(prev => Math.min(prev, total - 1));
    setTiles(createTiles(total));
    setRevealedCount(0);
    setGameOver(false);
    setWon(false);
    setMinePositions(new Set());
  }, [playing]);

  const startGame = useCallback(async () => {
    if (isDemo) {
      // Demo mode: use local provably fair
      betRef.current = betAmount;
      playBetPlace();
      const positions = await generateMinePositions(fairness.serverSeed, fairness.clientSeed, fairness.nonce, gridTotal, effectiveMineCount);
      setMinePositions(positions);
      setTiles(createTiles(gridTotal));
      setRevealedCount(0);
      gemsFoundRef.current = 0;
      revealedTilesRef.current = [];
      setGameOver(false);
      setWon(false);
      setPlaying(true);
      return;
    }

    // Real mode: start UI immediately, sync with server in background
    betRef.current = betAmount;
    playBetPlace();
    const positions = await generateMinePositions(fairness.serverSeed, fairness.clientSeed, fairness.nonce, gridTotal, effectiveMineCount);
    setMinePositions(positions);
    setTiles(createTiles(gridTotal));
    setRevealedCount(0);
    gemsFoundRef.current = 0;
    revealedTilesRef.current = [];
    setGameOver(false);
    setWon(false);
    setPlaying(true);

    // Fire server call in background — if it fails, abort the game
    gameSession.startGame(betAmount, {
      grid_total: gridTotal,
      mine_count: effectiveMineCount,
    }).then((sid) => {
      if (!sid) {
        // Server rejected — reset game state
        setPlaying(false);
        setGameOver(false);
        setTiles(createTiles(gridTotal));
        setMinePositions(new Set());
      }
    });
  }, [effectiveMineCount, gridTotal, fairness, betAmount, isDemo, gameSession]);

  const revealTile = useCallback(
    (index: number) => {
      if (!playing || gameOver) return;

      const isMine = minePositions.has(index);
      setTiles((prev) => {
        if (prev[index]?.revealed) return prev;
        const next = [...prev];
        next[index] = { revealed: true, isMine };
        return next;
      });

      revealedTilesRef.current.push(index);

      if (isMine) {
        playMineExplosion();
        setShakeGrid(true);
        setTimeout(() => setShakeGrid(false), 320);
        setGameOver(true);
        setWon(false);
        
        if (isDemo) {
          fairness.rotateSeed();
        } else {
          // Resolve with server — loss
          gameSession.resolveGame({
            revealed_tiles: revealedTilesRef.current,
            cashout: false,
          });
        }
        
        setTimeout(() => {
          setTiles((prev) => prev.map((tile, i) => (minePositions.has(i) ? { ...tile, revealed: true, isMine: true } : tile)));
        }, 100);
        return;
      }

      gemsFoundRef.current += 1;
      playGemRevealChain(gemsFoundRef.current);
      const nextRevealed = revealedCount + 1;
      setRevealedCount(nextRevealed);

      if (nextRevealed >= gridTotal - effectiveMineCount) {
        playCashout();
        setGameOver(true);
        setWon(true);
        
        if (isDemo) {
          fairness.rotateSeed();
        } else {
          gameSession.resolveGame({
            revealed_tiles: revealedTilesRef.current,
            cashout: true,
          });
        }
      }
    },
    [gameOver, effectiveMineCount, gridTotal, minePositions, playing, revealedCount, fairness, isDemo, gameSession]
  );

  const cashout = useCallback(() => {
    if (!playing || gameOver || revealedCount === 0) return;
    playCashout();
    setGameOver(true);
    setWon(true);
    
    if (isDemo) {
      fairness.rotateSeed();
    } else {
      gameSession.resolveGame({
        revealed_tiles: revealedTilesRef.current,
        cashout: true,
      });
    }
    
    setTiles((prev) => prev.map((tile, i) => (minePositions.has(i) ? { ...tile, revealed: true, isMine: true } : tile)));
  }, [gameOver, minePositions, playing, revealedCount, fairness, multiplier, isDemo, gameSession]);

  // Use gameSession fairness info when not in demo mode
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
            <h1 className="text-3xl font-black text-foreground tracking-tight">Mines</h1>
            <DemoToggle isDemo={isDemo} onToggle={toggleDemo} />
          </div>
          <FairnessInfo
            serverSeedHash={displaySeedHash}
            clientSeed={displayClientSeed}
            nonce={displayNonce}
            lastVerification={displayVerification}
            onClientSeedChange={handleClientSeedChange}
            disabled={playing}
            gameName="Mines"
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
                <button type="button" onClick={() => setBetAmount((value) => Math.max(0.01, parseFloat((value / 2).toFixed(2))))} disabled={playing} className="game-mini-btn">
                  ½
                </button>
                <button type="button" onClick={() => setBetAmount((value) => parseFloat((value * 2).toFixed(2)))} disabled={playing} className="game-mini-btn">
                  2x
                </button>
              </div>
            </div>

            <div>
              <label className="game-label">Grid Size</label>
              <div className="game-segmented game-segmented-4">
                {GRID_OPTIONS.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleGridChange(size)}
                    disabled={playing}
                    className={`game-segment ${size === gridTotal ? "game-segment-active" : "game-segment-idle"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="game-label">Number of Mines</label>
              <div className="game-slider-shell">
                <div className="flex items-center gap-3">
                  <div className="game-count-pill">
                    <span className="game-count-icon" style={{ backgroundImage: `url(${ICONS.GEM_ICON_DATA})` }} />
                    <span>{gridTotal - effectiveMineCount}</span>
                  </div>

                  <input
                    type="range"
                    min={MIN_MINES}
                    max={maxMines}
                    step={1}
                    value={effectiveMineCount}
                    disabled={playing}
                    onChange={(e) => setMineCount(Number(e.target.value))}
                    className="game-range"
                    style={{
                      background: `linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary)) ${sliderFill}%, hsl(var(--destructive)) ${sliderFill}%, hsl(var(--destructive)) 100%)`,
                    }}
                  />

                  <div className="game-count-pill game-count-pill-danger">
                    <span className="game-count-icon" style={{ backgroundImage: `url(${bombImg})` }} />
                    <span>{effectiveMineCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {playing && (
              <div className="game-stat-grid animate-fade-in">
                <div className="game-stat">
                  <p className="game-stat-label">Multiplier</p>
                  <p className="game-stat-value text-primary">{multiplier.toFixed(2)}x</p>
                </div>
                <div className="game-stat">
                  <p className="game-stat-label">Cashout</p>
                  <p className="game-stat-value">${potentialCashout.toFixed(2)}</p>
                </div>
              </div>
            )}

            {!playing ? (
              <button onClick={startGame} className="game-gold-btn">
                PLACE BET
              </button>
            ) : !gameOver ? (
              <button onClick={cashout} disabled={revealedCount === 0} className="game-cashout-btn disabled:opacity-50">
                CASHOUT ${potentialCashout.toFixed(2)}
              </button>
            ) : (
              <button onClick={startGame} className="game-gold-btn">
                PLAY AGAIN
              </button>
            )}

          </div>

          <div
            className={`relative rounded-lg p-5 md:p-6 flex items-center justify-center overflow-hidden transition-transform ${shakeGrid ? "animate-shake" : ""}`}
            style={{ background: "linear-gradient(135deg, hsl(229 41% 18%), hsl(226 42% 14%))" }}
          >
            <div className="absolute inset-0 opacity-[0.08] bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url(${minesBg})` }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 50%, transparent 34%, hsl(226 42% 10% / 0.62) 100%)" }} />

            <div
              className="relative z-10 grid gap-2 w-full max-w-[580px] aspect-square"
              style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
            >
              {tiles.map((tile, index) => {
                const tileIsMine = minePositions.has(index);
                const icon = tileIsMine ? bombImg : gemImg;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => revealTile(index)}
                    disabled={!playing || gameOver || tile.revealed}
                    className={`relative rounded-md aspect-square overflow-hidden transition-all duration-150 ${tile.revealed ? (tile.isMine ? "mine-tile-revealed" : "gem-tile-revealed") : "mine-tile-unrevealed"} ${!playing ? "opacity-75 cursor-default" : ""}`}
                  >
                    <div
                      className={`tile-icon ${tile.revealed ? "tile-icon-visible" : ""}`}
                      style={{ backgroundImage: `url(${icon})` }}
                    />
                  </button>
                );
            })}
            </div>

            {/* Win overlay */}
            {gameOver && won && (
              <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-sm" onClick={() => {}}>
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
                      {multiplier.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold text-green-300">
                      {isDemo ? "Demo Mode" : `$${potentialCashout.toFixed(2)}`}
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

export default Mines;
