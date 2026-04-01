import { useNavigate } from "react-router-dom";
import type { Game } from "@/data/mockData";

interface GameCardProps {
  game: Game;
}

const GameCard = ({ game }: GameCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (game.link) {
      navigate(game.link);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="group relative rounded-xl overflow-hidden bg-card transition-all duration-150 hover:scale-[1.03] hover:shadow-lg text-left w-full"
    >
      {/* Gradient thumbnail */}
      <div
        className="aspect-[3/4] flex items-end p-3 relative overflow-hidden"
        style={{ background: game.image ? undefined : `linear-gradient(135deg, ${game.color1}, ${game.color2})` }}
      >
        {game.image && (
          <img src={game.image} alt={game.name} className="absolute inset-0 w-full h-full object-cover" />
        )}
        {!game.image && (
          <span className="text-2xl font-black text-white/90 leading-none drop-shadow-lg uppercase">
            {game.name}
          </span>
        )}
      </div>

      {/* Badges */}
      {(game.isNew || game.isHot) && (
        <div className="absolute top-2 right-2 flex gap-1">
          {game.isHot && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-destructive text-destructive-foreground uppercase">
              Hot
            </span>
          )}
          {game.isNew && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary text-primary-foreground uppercase">
              New
            </span>
          )}
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
        <span className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          {game.link ? "Open" : "Play"}
        </span>
      </div>

      {/* Info bar */}
      <div className="px-3 py-2.5">
        <p className="text-xs font-semibold text-foreground truncate">{game.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{game.provider}</p>
      </div>
    </button>
  );
};

export default GameCard;
