import type { Game } from "@/data/mockData";
import GameCard from "./GameCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface GameGridProps {
  title: string;
  games: Game[];
  icon?: React.ReactNode;
}

const GameGrid = ({ title, games, icon }: GameGridProps) => {
  if (games.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            View All
          </button>
        </div>
        <div className="flex gap-1">
          <button className="p-1 rounded-lg bg-secondary hover:bg-accent transition-colors">
            <ChevronLeft size={16} className="text-muted-foreground" />
          </button>
          <button className="p-1 rounded-lg bg-secondary hover:bg-accent transition-colors">
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  );
};

export default GameGrid;
