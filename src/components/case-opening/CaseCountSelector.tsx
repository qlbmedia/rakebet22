interface CaseCountSelectorProps {
  count: number;
  onChange: (count: number) => void;
  disabled?: boolean;
}

export const CaseCountSelector = ({ count, onChange, disabled }: CaseCountSelectorProps) => {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          disabled={disabled}
          className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
            count === n
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
          } disabled:opacity-50 disabled:pointer-events-none`}
        >
          {n}
        </button>
      ))}
    </div>
  );
};
