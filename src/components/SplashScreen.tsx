import { useState, useEffect, useRef, useCallback } from "react";
import rakebetLogo from "@/assets/rakebet-logo-opt.webp";
import { preloadCaseImages } from "@/lib/preloadAssets";

interface SplashScreenProps {
  onFinished: () => void;
}

const SplashScreen = ({ onFinished }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);
  const rafRef = useRef<number>(0);
  const clipId = "liquid-clip";
  const pathRef = useRef<SVGPathElement>(null);
  const progressRef = useRef(0);

  const buildPath = useCallback((fill: number, time: number) => {
    // fill 0-100 maps to y 100->0 (bottom to top in viewBox 0 0 100 100)
    const baseY = 100 - fill;
    const amp1 = 2 + Math.sin(time * 0.8) * 1.2;
    const amp2 = 1.2 + Math.cos(time * 1.3) * 0.8;
    const amp3 = 0.8 + Math.sin(time * 1.6) * 0.4;
    const freq1 = 0.04 + Math.sin(time * 0.2) * 0.008;
    const freq2 = 0.08;
    const freq3 = 0.16;
    const points: string[] = [];
    for (let x = 0; x <= 100; x += 1.5) {
      const y =
        baseY +
        Math.sin(x * freq1 + time * 2.2) * amp1 +
        Math.cos(x * freq2 + time * 1.5) * amp2 +
        Math.sin(x * freq3 + time * 0.9) * amp3;
      points.push(`${x === 0 ? "M" : "L"}${x},${y}`);
    }
    return `${points.join(" ")} L100,100 L0,100 Z`;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const startTime = Date.now();
    const minDuration = 2200;

    let target = 0;
    let current = 0;
    let done = false;
    let t = 0;

    const tick = () => {
      if (cancelled) return;
      t += 0.016;

      if (!done) {
        if (Math.random() < 0.04 && current > 20) {
          target = current - (3 + Math.random() * 8);
        } else {
          target = Math.min(target + (0.4 + Math.random() * 1.2), 85);
        }
      }

      current += (target - current) * 0.06;
      current = Math.min(current, 100);
      progressRef.current = current;

      if (pathRef.current) {
        pathRef.current.setAttribute("d", buildPath(current, t));
      }

      if (current >= 99.5 && done) {
        if (pathRef.current) {
          pathRef.current.setAttribute("d", buildPath(100, t));
        }
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minDuration - elapsed);
        setTimeout(() => {
          if (!cancelled) setFadeOut(true);
          setTimeout(() => {
            if (!cancelled) onFinished();
          }, 700);
        }, remaining);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    preloadCaseImages().then(() => {
      if (cancelled) return;
      done = true;
      target = 100;
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [onFinished, buildPath]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-700 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Hidden SVG for clip path */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path
              ref={pathRef}
              d="M0,100 L100,100 L0,100 Z"
              transform="scale(0.01)"
            />
          </clipPath>
          {/* Add subtle gradient for glow effect */}
          <linearGradient id="logo-glow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(217 100% 60%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(217 100% 60%)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative h-24 sm:h-32">
        {/* Subtle glow backdrop */}
        {/* <div 
          className="absolute inset-0 rounded-full opacity-30 blur-xl"
          style={{
            background: "radial-gradient(circle, hsl(217 100% 60%) 0%, transparent 70%)",
            transform: "scale(1.2)"
          }}
        /> */}
        
        {/* Grey base logo */}
        <img
          src={rakebetLogo}
          alt=""
          className="h-full w-auto relative z-10"
          style={{ filter: "grayscale(1) brightness(0.25)" }}
        />
        
        {/* Colored logo with liquid clip */}
        <img
          src={rakebetLogo}
          alt="Rakebet"
          className="absolute inset-0 h-full w-auto z-20"
          style={{ 
            clipPath: `url(#${clipId})`
          }}
        />
      </div>
    </div>
  );
};

export default SplashScreen;
