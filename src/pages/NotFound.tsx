import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Gamepad2 } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [coins, setCoins] = useState<Array<{ id: number; left: number; delay: number; size: number }>>([]);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const generated = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      size: 16 + Math.random() * 20,
    }));
    setCoins(generated);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="absolute text-primary/30 pointer-events-none"
          style={{
            left: `${coin.left}%`,
            fontSize: `${coin.size}px`,
            animation: `coin-fall ${4 + Math.random() * 4}s linear infinite`,
            animationDelay: `${coin.delay}s`,
          }}
        >
          💰
        </div>
      ))}

      <div className="relative z-10 text-center px-4">
        <h1 className="text-8xl font-black text-primary text-glow-green mb-4">404</h1>
        <p className="text-xl font-semibold text-foreground mb-2">
          Looks like you lost this page…
        </p>
        <p className="text-muted-foreground mb-8">
          But don't worry, your luck might be better at the tables.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => navigate("/")}
            className="bg-primary text-primary-foreground font-bold glow-green-sm"
          >
            <Home size={16} className="mr-2" />
            Return Home
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="border-border text-foreground hover:bg-muted"
          >
            <Gamepad2 size={16} className="mr-2" />
            Try a Game
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
