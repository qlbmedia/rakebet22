import { useMemo } from "react";
import { type CaseItem, type GameCase, RARITY_HEX } from "@/data/caseData";

interface CaseIdlePreviewProps {
  caseData: GameCase;
  height?: number;
}

export const CaseIdlePreview = ({ caseData, height = 320 }: CaseIdlePreviewProps) => {
  // Pick ~12 items to orbit around
  const orbitItems = useMemo(() => {
    const items: CaseItem[] = [];
    const pool = caseData.items;
    for (let i = 0; i < 12; i++) {
      items.push(pool[i % pool.length]);
    }
    return items;
  }, [caseData.items]);

  return (
    <div
      className="relative rounded-md overflow-hidden w-full flex items-center justify-center"
      style={{
        height,
        background: "linear-gradient(160deg, hsl(222 34% 12%), hsl(222 30% 8%))",
        border: "1px solid hsl(222 20% 20%)",
      }}
    >
      {/* Orbiting items - blurred ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative"
          style={{
            width: height * 0.85,
            height: height * 0.85,
            animation: "orbit-spin 30s linear infinite",
          }}
        >
          {orbitItems.map((item, i) => {
            const angle = (360 / orbitItems.length) * i;
            const radius = height * 0.35;
            return (
              <img
                key={i}
                src={item.imageUrl}
                alt=""
                className="absolute"
                crossOrigin="anonymous"
                style={{
                  width: 64,
                  height: 64,
                  objectFit: "contain",
                  left: "50%",
                  top: "50%",
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(${radius}px) rotate(-${angle}deg)`,
                  filter: `blur(3px) drop-shadow(0 0 8px ${RARITY_HEX[item.rarity]}60)`,
                  opacity: 0.5,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Central case image */}
      <div className="relative z-10 flex flex-col items-center">
        <img
          src={caseData.image}
          alt={caseData.name}
          className="w-40 h-40 object-contain drop-shadow-2xl"
          style={{
            filter: "drop-shadow(0 0 30px hsl(var(--primary) / 0.3))",
          }}
        />
      </div>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, hsl(222 34% 8% / 0.8) 100%)",
        }}
      />
    </div>
  );
};
