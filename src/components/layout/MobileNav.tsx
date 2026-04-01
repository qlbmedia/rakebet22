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
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => (
          <button key={item.label} className="flex flex-col items-center gap-1 py-2 px-3 min-w-0 flex-1">
            <item.icon
              size={16}
              className={item.active ? "text-primary" : "text-muted-foreground"}
            />
            <span className={`text-[10px] font-semibold ${item.active ? "text-primary" : "text-muted-foreground"}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
