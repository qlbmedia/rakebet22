import { Gamepad2, Trophy, MonitorPlay, User, Home } from "lucide-react";

const items = [
  { icon: Home, label: "Home", active: true },
  { icon: Gamepad2, label: "Casino" },
  { icon: Trophy, label: "Sports" },
  { icon: MonitorPlay, label: "Live" },
  { icon: User, label: "Profile" },
];

const MobileNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border lg:hidden">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => (
          <button key={item.label} className="flex flex-col items-center gap-0.5 py-1 px-3">
            <item.icon
              size={18}
              className={item.active ? "text-primary" : "text-muted-foreground"}
            />
            <span className={`text-[9px] font-semibold ${item.active ? "text-primary" : "text-muted-foreground"}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
