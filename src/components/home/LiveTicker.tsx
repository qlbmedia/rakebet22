import { liveBets } from "@/data/mockData";

const LiveTicker = () => {
  const doubled = [...liveBets, ...liveBets];

  return (
    <div className="overflow-hidden rounded-xl bg-card">
      <div
        className="flex gap-6 py-2.5 px-4 whitespace-nowrap"
        style={{
          animation: "ticker-scroll 30s linear infinite",
          width: "fit-content",
        }}
      >
        {doubled.map((bet, i) => (
          <span key={i} className="flex items-center gap-1.5 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span className="text-muted-foreground font-medium">{bet.user}</span>
            <span className="text-primary font-bold">${bet.amount.toLocaleString()}</span>
            <span className="text-muted-foreground">on</span>
            <span className="text-foreground font-medium">{bet.game}</span>
            <span className="text-muted-foreground font-semibold">{bet.multiplier}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default LiveTicker;
