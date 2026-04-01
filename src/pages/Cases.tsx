import { useNavigate } from "react-router-dom";
import { CASES, RARITY_HEX } from "@/data/caseData";


const Cases = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Cases Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
        {CASES.map((c) => {
          // Calculate a "fill" percentage based on case price relative to max
          const maxPrice = Math.max(...CASES.map(cs => cs.price));
          const fillPct = Math.min((c.price / maxPrice) * 100, 100);

          return (
            <button
              key={c.id}
              onClick={() => navigate(`/cases/${c.id}`)}
              className="group relative rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.04] active:scale-[0.97] focus:outline-none"
              style={{
                background: `linear-gradient(160deg, hsl(222 34% 18%), hsl(222 30% 13%))`,
                border: "1px solid hsl(222 20% 22%)",
              }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{
                  background: `radial-gradient(circle at 50% 40%, hsl(${c.color} / 0.18), transparent 70%)`,
                }}
              />

              {/* Case image area */}
              <div className="aspect-square flex items-center justify-center p-4 md:p-6 relative">
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Price badge - overlapping image area */}
              <div className="absolute left-3 bottom-[72px] md:bottom-[80px]">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{
                    background: "hsl(222 28% 28% / 0.85)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid hsl(222 20% 34%)",
                  }}
                >
                  <span className="text-sm font-bold text-foreground">
                    ${c.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Bottom section */}
              <div className="px-3 pb-3 pt-1 space-y-2">
                <p className="text-sm md:text-base font-bold text-foreground text-left truncate">
                  {c.name}
                </p>

                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "hsl(222 25% 16%)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${fillPct}%`,
                      background: `linear-gradient(90deg, hsl(${c.color}), hsl(${c.color} / 0.6))`,
                    }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Cases;
