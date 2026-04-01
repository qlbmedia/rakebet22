import { useState, useEffect } from "react";
import { promos } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const gradients = [
  "linear-gradient(135deg, #1e3a5f, #2563eb)",
  "linear-gradient(135deg, #1e3a5f, #7c3aed)",
  "linear-gradient(135deg, #1e3a5f, #0891b2)",
];

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % promos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const promo = promos[current];

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div
        className="relative p-8 md:p-12 min-h-[200px] md:min-h-[260px] flex flex-col justify-center transition-all duration-500"
        style={{ background: gradients[current] }}
      >
        <div className="relative z-10 max-w-lg">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight leading-tight">
            {promo.title}
          </h2>
          <p className="text-white/60 text-sm mb-6">
            {promo.subtitle}
          </p>
          <div className="flex gap-3">
            <Button className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 rounded-full px-6">
              {promo.cta}
            </Button>
          </div>
        </div>

        {/* Nav arrows */}
        <div className="absolute right-4 bottom-4 flex gap-1.5">
          <button
            onClick={() => setCurrent((prev) => (prev - 1 + promos.length) % promos.length)}
            className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 transition-colors"
          >
            <ChevronLeft size={16} className="text-white" />
          </button>
          <button
            onClick={() => setCurrent((prev) => (prev + 1) % promos.length)}
            className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 transition-colors"
          >
            <ChevronRight size={16} className="text-white" />
          </button>
        </div>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {promos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-6 bg-white" : "w-1.5 bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
