import { useState, useRef, useEffect } from "react";
import { type CaseItem, RARITY_HEX } from "@/data/caseData";

import { playCaseTickSound } from "@/lib/sounds";

const ITEM_WIDTH = 160;
const ITEM_GAP = -30;
const ITEM_STEP = ITEM_WIDTH + ITEM_GAP;
const VISIBLE_ITEMS = 60;
const WINNER_INDEX = 48;
const SPIN_DURATION = 4200;
const STAGGER_DELAY = 1800;

const COMPACT_ITEM_SIZE = 140;
const COMPACT_ITEM_GAP = 10;
const COMPACT_ITEM_STEP = COMPACT_ITEM_SIZE + COMPACT_ITEM_GAP;

interface CaseReelProps {
  reelItems: CaseItem[];
  spinning: boolean;
  wonItem: CaseItem | null;
  showWinOverlay: boolean;
  spinKey: number;
  vertical?: boolean;
  spinDuration?: number;
}

export { ITEM_WIDTH, ITEM_GAP, ITEM_STEP, VISIBLE_ITEMS, WINNER_INDEX, SPIN_DURATION, STAGGER_DELAY, COMPACT_ITEM_SIZE, COMPACT_ITEM_GAP, COMPACT_ITEM_STEP };

export const CaseReel = ({
  reelItems,
  spinning,
  wonItem,
  showWinOverlay,
  spinKey,
  vertical = false,
  spinDuration = SPIN_DURATION,
}: CaseReelProps) => {
  const reelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tickIndexRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const [containerSize, setContainerSize] = useState(600);
  const [reelOffset, setReelOffset] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const itemStep = vertical ? COMPACT_ITEM_STEP : ITEM_STEP;
  const itemSize = vertical ? COMPACT_ITEM_SIZE : ITEM_WIDTH;
  const reelHeight = vertical ? 420 : 380;

  // Measure container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const size = vertical ? containerRef.current.clientHeight : containerRef.current.clientWidth;
        setContainerSize(size);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [vertical]);

  // Calculate and set offset when spinning starts
  useEffect(() => {
    if (spinning && containerSize > 0) {
      // Center the winner item in the container
      const winnerCenter = WINNER_INDEX * itemStep + itemSize / 2;
      const offset = winnerCenter - containerSize / 2;
      // Add small random jitter so it doesn't always land dead-center
      const jitter = (Math.random() - 0.5) * (itemSize * 0.15);
      
      setHasStarted(true);
      // Double rAF to ensure the 0-offset renders first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setReelOffset(offset + jitter);
        });
      });
    }
    if (!spinning && !showWinOverlay) {
      setReelOffset(0);
      setHasStarted(false);
    }
  }, [spinning, containerSize, itemStep, itemSize]);

  // Reset offset on new spin
  useEffect(() => {
    setReelOffset(0);
    setHasStarted(false);
  }, [spinKey]);

  // Tick sounds
  useEffect(() => {
    if (!spinning || !reelRef.current) return;
    tickIndexRef.current = 0;
    const checkTick = () => {
      if (!reelRef.current) return;
      const transform = getComputedStyle(reelRef.current).transform;
      if (transform && transform !== "none") {
        const matrix = new DOMMatrix(transform);
        const current = Math.abs(vertical ? matrix.m42 : matrix.m41);
        const centerOffset = containerSize / 2;
        const currentItemIndex = Math.floor((current + centerOffset) / itemStep);
        if (currentItemIndex > tickIndexRef.current) {
          tickIndexRef.current = currentItemIndex;
          playCaseTickSound();
        }
      }
      animFrameRef.current = requestAnimationFrame(checkTick);
    };
    animFrameRef.current = requestAnimationFrame(checkTick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [spinning, containerSize, itemStep, vertical]);

  const showWin = showWinOverlay && !spinning;
  const centeredIndex = showWinOverlay ? WINNER_INDEX : -1;

  const horizontalSpotlight = `linear-gradient(to right, 
    rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 15%, rgba(0,0,0,0.3) 30%, 
    rgba(0,0,0,0) 45%, rgba(0,0,0,0) 55%, 
    rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.6) 85%, rgba(0,0,0,0.85) 100%)`;

  const verticalSpotlight = `linear-gradient(to bottom, 
    rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 15%, rgba(0,0,0,0.3) 30%, 
    rgba(0,0,0,0) 45%, rgba(0,0,0,0) 55%, 
    rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.6) 85%, rgba(0,0,0,0.85) 100%)`;

  // Win overlay removed — no circle animation

  if (vertical) {
    return (
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ background: "hsl(var(--card) / 0.4)", height: reelHeight, minWidth: 160, flex: 1, borderRadius: '4px' }}
      >
        <div className="overflow-hidden relative h-full">
          <div
            ref={reelRef}
            key={spinKey}
            className="flex flex-col items-center"
            style={{
              gap: `${COMPACT_ITEM_GAP}px`,
              transform: `translateY(-${reelOffset}px)`,
              transition: hasStarted && spinning
                ? `transform ${spinDuration}ms cubic-bezier(0.12, 0.87, 0.28, 1)`
                : "none",
            }}
          >
            {reelItems.map((item, i) => {
              const isWinner = centeredIndex === i;
              return (
                <div
                  key={i}
                  className="flex-shrink-0 flex flex-col items-center justify-center relative"
                  style={{
                    width: COMPACT_ITEM_SIZE,
                    height: COMPACT_ITEM_SIZE,
                    zIndex: isWinner ? 30 : 1,
                  }}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-24 h-24 object-contain relative z-10"
                    style={{
                      filter: `drop-shadow(0 4px 12px ${RARITY_HEX[item.rarity]}40) ${isWinner ? `drop-shadow(0 0 20px ${RARITY_HEX[item.rarity]}60)` : ''}`,
                      transform: isWinner ? "scale(1.3)" : undefined,
                      transition: "transform 0.3s ease, filter 0.3s ease",
                    }}
                    crossOrigin="anonymous"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none z-20" style={{ background: verticalSpotlight }} />
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none z-[19]"
          style={{ height: COMPACT_ITEM_SIZE * 0.8, background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.08) 0%, transparent 70%)" }}
        />

        {/* Win overlay for vertical */}
        {/* Win overlay removed */}

        {showWinOverlay && wonItem && (
          <div className="absolute bottom-2 left-0 right-0 z-50 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-400">
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: RARITY_HEX[wonItem.rarity] }}>
              {wonItem.rarity}
            </span>
            <p className="text-[10px] font-bold text-foreground truncate max-w-[120px]">{wonItem.name}</p>
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] font-bold" style={{ color: RARITY_HEX[wonItem.rarity] }}>
                ${wonItem.value.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Horizontal (single case) mode
  return (
    <div ref={containerRef} className="relative rounded-md overflow-hidden w-full" style={{ background: "hsl(var(--card) / 0.4)" }}>
      <div className="overflow-hidden relative" style={{ height: reelHeight }}>
        <div
          ref={reelRef}
          key={spinKey}
          className="flex items-center h-full"
          style={{
            gap: `${ITEM_GAP}px`,
            transform: `translateX(-${reelOffset}px)`,
            transition: hasStarted && spinning
              ? `transform ${spinDuration}ms cubic-bezier(0.12, 0.87, 0.28, 1)`
              : "none",
          }}
        >
          {reelItems.map((item, i) => {
            const isWinner = centeredIndex === i;
            return (
              <div
                key={i}
                className="flex-shrink-0 flex flex-col items-center justify-center relative"
                style={{
                  width: ITEM_WIDTH,
                  height: reelHeight - 20,
                  zIndex: isWinner ? 30 : 1,
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-32 h-32 object-contain relative z-10"
                  style={{
                    filter: `drop-shadow(0 8px 20px ${RARITY_HEX[item.rarity]}40) ${isWinner ? `drop-shadow(0 0 30px ${RARITY_HEX[item.rarity]}60)` : ''}`,
                    transform: isWinner ? "scale(1.25)" : undefined,
                    transition: "transform 0.3s ease, filter 0.3s ease",
                  }}
                  crossOrigin="anonymous"
                />
                {isWinner && wonItem && showWinOverlay && (
                  <div className="flex flex-col items-center absolute bottom-2 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in duration-700">
                    <div className="bg-gradient-to-r from-purple-600/90 to-blue-600/90 backdrop-blur-sm rounded-xl px-4 py-3 flex flex-col items-center border-2 border-white/30 shadow-2xl">
                      <span className="text-[11px] font-black uppercase tracking-widest mb-1 text-yellow-300">
                        {wonItem.rarity}
                      </span>
                      <p className="text-base font-bold text-white whitespace-nowrap text-center">{wonItem.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-base font-bold text-green-300">
                          ${wonItem.value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Spotlight */}
      <div className="absolute inset-0 pointer-events-none z-20" style={{ background: horizontalSpotlight }} />
      <div
        className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 pointer-events-none z-[19]"
        style={{ width: ITEM_WIDTH * 1.2, background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.08) 0%, transparent 70%)" }}
      />

      {/* Win overlay removed */}
    </div>
  );
};
