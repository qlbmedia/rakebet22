interface DemoToggleProps {
  isDemo: boolean;
  onToggle: () => void;
}

export function DemoToggle({ isDemo, onToggle }: DemoToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all border
        ${isDemo
          ? "bg-secondary border-border text-foreground"
          : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
    >
      <div className={`w-7 h-4 rounded-full transition-colors relative ${isDemo ? "bg-secondary/80" : "bg-muted"}`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${isDemo ? "left-3.5 bg-foreground" : "left-0.5 bg-muted-foreground"}`} />
      </div>
      {isDemo ? "Demo" : "Demo"}
    </button>
  );
}
