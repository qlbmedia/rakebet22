import { Trophy, Crown } from "lucide-react";

const RewardBanner = () => {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card hover:bg-secondary transition-colors cursor-pointer">
        <Trophy size={20} className="text-primary shrink-0" />
        <div>
          <p className="text-xs font-bold text-foreground">Daily</p>
          <p className="text-sm font-bold text-primary">$25K</p>
        </div>
      </div>
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card hover:bg-secondary transition-colors cursor-pointer">
        <Crown size={20} className="text-primary shrink-0" />
        <div>
          <p className="text-xs font-bold text-foreground">Weekly</p>
          <p className="text-sm font-bold text-primary">$100K</p>
        </div>
      </div>
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card hover:bg-secondary transition-colors cursor-pointer">
        <Trophy size={20} className="text-primary shrink-0" />
        <div>
          <p className="text-xs font-bold text-foreground">Monthly</p>
          <p className="text-sm font-bold text-primary">$500K</p>
        </div>
      </div>
    </div>
  );
};

export default RewardBanner;
