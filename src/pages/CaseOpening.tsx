import { useState, useRef, useCallback, useEffect } from "react";
import { useDemoMode } from "@/hooks/useDemoMode";
import { DemoToggle } from "@/components/DemoToggle";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CASES, pickRandomItem, RARITY_HEX, type CaseItem } from "@/data/caseData";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

import { playCaseWinReveal } from "@/lib/sounds";
import { generateCaseRoll } from "@/lib/provablyFair";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { useGameSession } from "@/hooks/useGameSession";
import { FairnessInfo } from "@/components/FairnessInfo";
import { CaseReel, VISIBLE_ITEMS, WINNER_INDEX, SPIN_DURATION } from "@/components/case-opening/CaseReel";
import { CaseCountSelector } from "@/components/case-opening/CaseCountSelector";
import { CaseIdlePreview } from "@/components/case-opening/CaseIdlePreview";
import { useBalance } from "@/hooks/useBalance";

const REEL_STAGGER = 800;

interface ReelState {
  items: CaseItem[];
  wonItem: CaseItem | null;
  showWin: boolean;
  spinning: boolean;
  spinKey: number;
  spinDuration: number;
}

const emptyReel = (key = 0): ReelState => ({
  items: [],
  wonItem: null,
  showWin: false,
  spinning: false,
  spinKey: key,
  spinDuration: SPIN_DURATION,
});

const CaseOpening = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const caseData = CASES.find((c) => c.id === slug);
  const fairness = useProvablyFair();
  const gameSession = useGameSession("cases");
  const { isDemo, toggleDemo } = useDemoMode();
  const { balance } = useBalance();

  const [caseCount, setCaseCount] = useState(1);
  const [globalSpinning, setGlobalSpinning] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [reels, setReels] = useState<ReelState[]>([emptyReel()]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Preload all item images when viewing a case
  useEffect(() => {
    if (!caseData) return;
    setImagesLoaded(false);
    const urls = caseData.items.map((item) => item.imageUrl);
    let loaded = 0;
    const total = urls.length;
    urls.forEach((url) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded >= total) setImagesLoaded(true);
      };
      img.src = url;
    });
    // Fallback in case images load instantly (cached)
    if (total === 0) setImagesLoaded(true);
  }, [caseData]);

  const generateReel = useCallback(
    (winner: CaseItem) => {
      if (!caseData) return [];
      const items: CaseItem[] = [];
      for (let i = 0; i < VISIBLE_ITEMS; i++) {
        items.push(pickRandomItem(caseData));
      }
      items[WINNER_INDEX] = winner;
      return items;
    },
    [caseData]
  );

  const openCase = useCallback(async () => {
    if (!caseData || globalSpinning) return;

    const totalCost = caseData.price * caseCount;

    if (isDemo) {
      // Demo mode - no server
    } else {
      const items = caseData.items.map(i => ({ name: i.name, value: i.value, rarity: i.rarity, weight: 1 }));
      const sid = await gameSession.startGame(totalCost, { items });
      if (!sid) return;
      await gameSession.resolveGame({ case_count: caseCount }, sid);
    }

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const newReels: ReelState[] = [];
    for (let r = 0; r < caseCount; r++) {
      const roll = await generateCaseRoll(fairness.serverSeed, fairness.clientSeed, fairness.nonce + r);
      const winner = pickRandomItem(caseData, roll);
      const items = generateReel(winner);
      const reelDuration = caseCount === 1 ? SPIN_DURATION : SPIN_DURATION + r * REEL_STAGGER;
      newReels.push({
        items,
        wonItem: winner,
        showWin: false,
        spinning: true,
        spinKey: Date.now() + r,
        spinDuration: reelDuration,
      });
    }

    setReels(newReels);
    setGlobalSpinning(true);
    setHasOpened(true);

    // Offset is now calculated internally by CaseReel

    if (caseCount === 1) {
      const t = setTimeout(() => {
        setReels((prev) => prev.map((reel) => ({ ...reel, showWin: true, spinning: false })));
        setGlobalSpinning(false);
        playCaseWinReveal(newReels[0].wonItem?.rarity || "common");
        fairness.rotateSeed();
      }, SPIN_DURATION);
      timersRef.current.push(t);
    } else {
      for (let r = 0; r < caseCount; r++) {
        const stopDelay = SPIN_DURATION + r * REEL_STAGGER;
        const t = setTimeout(() => {
          setReels((prev) =>
            prev.map((reel, idx) =>
              idx === r ? { ...reel, showWin: true, spinning: false } : reel
            )
          );
          playCaseWinReveal(newReels[r].wonItem?.rarity || "common");
          if (r === caseCount - 1) {
            setGlobalSpinning(false);
            fairness.rotateSeed();
          }
        }, stopDelay);
        timersRef.current.push(t);
      }
    }
  }, [caseData, globalSpinning, caseCount, generateReel, fairness, isDemo, gameSession]);

  if (!caseData) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Case not found.</p>
        <Link to="/cases" className="text-primary hover:underline mt-2 inline-block">
          Back to Cases
        </Link>
      </div>
    );
  }

  const totalPrice = caseData.price * caseCount;
  const isMulti = caseCount > 1;
  const anyWon = reels.some((r) => r.showWin && r.wonItem);
  const allDone = reels.every((r) => !r.spinning);
  const showIdlePreview = !hasOpened && !globalSpinning;

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/cases")}
            className="p-2 rounded-md hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{caseData.name}</h1>
        </div>
        <FairnessInfo
          serverSeedHash={isDemo ? fairness.serverSeedHash : gameSession.serverSeedHash}
          clientSeed={isDemo ? fairness.clientSeed : gameSession.clientSeed}
          nonce={isDemo ? fairness.nonce : gameSession.nonce}
          lastVerification={isDemo ? fairness.lastVerification : gameSession.lastVerification}
          onClientSeedChange={isDemo ? fairness.updateClientSeed : gameSession.updateClientSeed}
          disabled={globalSpinning}
          gameName="Cases"
        />
      </div>

      {/* Reel area OR idle preview */}
      {showIdlePreview ? (
        <CaseIdlePreview caseData={caseData} height={320} />
      ) : (
        <div className={`flex ${isMulti ? "flex-row gap-0 justify-center" : "flex-col gap-0"}`}>
          {reels.map((reel, i) => (
            <CaseReel
              key={reel.spinKey || i}
              reelItems={reel.items}
              spinning={reel.spinning}
              wonItem={reel.wonItem}
              showWinOverlay={reel.showWin}
              spinKey={reel.spinKey}
              vertical={isMulti}
              spinDuration={reel.spinDuration}
            />
          ))}
        </div>
      )}

      {/* Controls bar */}
      <div className="flex items-center gap-3">
        <DemoToggle isDemo={isDemo} onToggle={toggleDemo} />
        <CaseCountSelector count={caseCount} onChange={setCaseCount} disabled={globalSpinning} />
        <button
          onClick={openCase}
          disabled={globalSpinning || !imagesLoaded}
          className="game-gold-btn flex-1 h-10 text-sm disabled:opacity-50"
        >
          {globalSpinning ? (
            "OPENING..."
          ) : !imagesLoaded ? (
            "LOADING..."
          ) : (
            <span className="flex items-center justify-center gap-2">
              OPEN {caseCount > 1 ? caseCount : 1} FOR
              <span className="font-black">${totalPrice.toLocaleString()}</span>
            </span>
          )}
        </button>
      </div>

      {/* Open Again */}
      {anyWon && !globalSpinning && allDone && (
        <div className="flex justify-center animate-in fade-in duration-300">
          <Button variant="outline" onClick={openCase} className="gap-2 rounded-md">
            <RotateCcw size={16} /> Open Again
          </Button>
        </div>
      )}

      {/* Case contents */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Case Contents
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {(() => {
            const weights: Record<string, number> = { common: 50, uncommon: 25, rare: 15, epic: 8, legendary: 2 };
            const totalWeight = caseData.items.reduce((sum, it) => sum + (weights[it.rarity] || 1), 0);
            return caseData.items.map((item, i) => {
              const pct = ((weights[item.rarity] || 1) / totalWeight * 100);
              const pctStr = pct < 1 ? pct.toFixed(2) : pct.toFixed(1);
              return (
                <div
                  key={i}
                  className="group relative rounded-md overflow-hidden flex flex-col items-center text-center"
                  style={{
                    background: `linear-gradient(160deg, hsl(222 34% 22%), hsl(222 30% 16%))`,
                    border: `1px solid hsl(222 20% 26%)`,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{
                      backgroundImage: `repeating-linear-gradient(135deg, transparent, transparent 20px, hsl(222 20% 40%) 20px, hsl(222 20% 40%) 21px)`,
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-[0.12] pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 50% 40%, ${RARITY_HEX[item.rarity]}40, transparent 70%)`,
                    }}
                  />
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-sm"
                      style={{
                        background: 'hsl(222 28% 14% / 0.85)',
                        color: RARITY_HEX[item.rarity],
                        border: `1px solid ${RARITY_HEX[item.rarity]}30`,
                      }}
                    >
                      {pctStr}%
                    </span>
                  </div>
                  <div className="aspect-square w-full flex items-center justify-center p-5 relative z-[1]">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-300"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="px-3 pb-3 pt-0 w-full relative z-[1]">
                    <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <span className="text-sm font-bold" style={{ color: RARITY_HEX[item.rarity] }}>
                        ${item.value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
};

export default CaseOpening;
