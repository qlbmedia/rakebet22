import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home, Star, Clock, Gift, Trophy,
  Crown, Target, Megaphone,
  Award, BookOpen, Headphones, Globe, ChevronDown, ChevronLeft, Package
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/* ── Custom SVG game icons for unique, non-AI look ── */

const IconMines = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <line x1="12" y1="3" x2="12" y2="7" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <line x1="3" y1="12" x2="7" y2="12" />
    <line x1="17" y1="12" x2="21" y2="12" />
  </svg>
);

const IconLimbo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20L12 4L20 20" />
    <line x1="8" y1="14" x2="16" y2="14" />
    <circle cx="12" cy="10" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

const IconKeno = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <rect x="6" y="6" width="4" height="4" rx="0.5" fill="currentColor" stroke="none" />
    <rect x="14" y="6" width="4" height="4" rx="0.5" fill="currentColor" stroke="none" opacity="0.4" />
    <rect x="6" y="14" width="4" height="4" rx="0.5" fill="currentColor" stroke="none" opacity="0.4" />
    <rect x="14" y="14" width="4" height="4" rx="0.5" fill="currentColor" stroke="none" />
  </svg>
);

const IconCases = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
    <line x1="3" y1="13" x2="21" y2="13" />
    <rect x="10" y="11" width="4" height="4" rx="0.5" fill="currentColor" stroke="none" />
  </svg>
);

const IconPlinko = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1" />
    <circle cx="6" cy="8" r="1" />
    <circle cx="18" cy="8" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="6" cy="16" r="1" />
    <circle cx="18" cy="16" r="1" />
    <circle cx="12" cy="19" r="1" />
    <path d="M12 6v6l-2 2" />
  </svg>
);

const IconOriginals = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" />
  </svg>
);

/* ── Navigation data ── */

const originalsGames = [
  { name: "Limbo", icon: IconLimbo, path: "/limbo" },
  { name: "Mines", icon: IconMines, path: "/mines" },
  { name: "Keno", icon: IconKeno, path: "/keno" },
  { name: "Plinko", icon: IconPlinko, path: "/plinko" },
];

const topNav = [
  { name: "Home", icon: Home, path: "/" },
  { name: "Cases", icon: IconCases, path: "/cases", isCustom: true },
];

const extraNav = [
  { name: "VIP", icon: Crown, badge: "EXCLUSIVE" },
  { name: "$25K Daily Race", icon: Trophy, badge: "15:12:39" },
  { name: "$100K Weekly Race", icon: Trophy, badge: "4d" },
  { name: "$500K Monthly Race", icon: Trophy, badge: "8d" },
  { name: "Challenges", icon: Target },
  { name: "Promotions", icon: Megaphone },
];

const bottomNav = [
  { name: "Rewards", icon: Award },
  { name: "Blog", icon: BookOpen },
  { name: "Live Support", icon: Headphones },
  { name: "Language: English", icon: Globe },
];

const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [originalsOpen, setOriginalsOpen] = useState(true);

  const navBtnClass = (active: boolean) =>
    `w-full flex items-center gap-3 rounded-md transition-all duration-150 group
     ${collapsed ? "justify-center p-2.5" : "px-3 py-2.5"}
     ${active
       ? "bg-primary/10 text-primary"
       : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
     }`;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-20 left-0 bottom-0 z-40 bg-card border-r border-border transition-all duration-200 flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "w-16" : "w-56"}
        `}
      >
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {/* Top nav - Home & Cases */}
          {topNav.map((item) => {
            const isActive = item.path ? location.pathname === item.path : false;
            return (
              <button
                key={item.name}
                onClick={() => { if (item.path) navigate(item.path); }}
                className={navBtnClass(isActive)}
              >
                {item.isCustom ? (
                  <item.icon />
                ) : (
                  <item.icon size={20} className="shrink-0" />
                )}
                {!collapsed && (
                  <span className="text-sm font-semibold">{item.name}</span>
                )}
              </button>
            );
          })}

          {/* Divider */}
          <div className="border-t border-border/50 my-3" />

          {/* Originals section - collapsible */}
          <div>
            <button
              onClick={() => !collapsed && setOriginalsOpen(!originalsOpen)}
              className={`w-full flex items-center gap-3 rounded-md transition-all duration-150 group
                ${collapsed ? "justify-center p-2.5" : "px-3 py-2.5"}
                text-foreground hover:bg-secondary/60
              `}
            >
              <IconOriginals />
              {!collapsed && (
                <>
                  <span className="text-sm font-bold flex-1 text-left">Originals</span>
                  <ChevronDown
                    size={14}
                    className={`text-muted-foreground transition-transform duration-200 ${originalsOpen ? "rotate-180" : ""}`}
                  />
                </>
              )}
            </button>

            {/* Originals game list */}
            {(originalsOpen || collapsed) && (
              <div className={`${collapsed ? "" : "ml-2 mt-1"} space-y-0.5`}>
                {originalsGames.map((game) => {
                  const isActive = location.pathname === game.path;
                  return (
                    <button
                      key={game.name}
                      onClick={() => navigate(game.path)}
                      className={navBtnClass(isActive)}
                    >
                      <game.icon />
                      {!collapsed && (
                        <span className="text-sm font-medium flex-1 text-left">{game.name}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border/50 my-3" />

          {/* Extra nav */}
          {extraNav.map((item) => (
            <button
              key={item.name}
              className={`w-full flex items-center gap-3 rounded-md transition-all duration-150 hover:bg-secondary/60 group
                ${collapsed ? "justify-center p-2.5" : "px-3 py-2.5"}
              `}
            >
              <item.icon size={20} className="text-muted-foreground shrink-0" />
              {!collapsed && (
                <>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground flex-1 text-left">
                    {item.name}
                  </span>
                  {item.badge && (
                    <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}

          {/* Divider */}
          <div className="border-t border-border/50 my-3" />

          {/* Bottom nav */}
          {bottomNav.map((item) => (
            <button
              key={item.name}
              className={`w-full flex items-center gap-3 rounded-md transition-all duration-150 hover:bg-secondary/60 group
                ${collapsed ? "justify-center p-2.5" : "px-3 py-2.5"}
              `}
            >
              <item.icon size={20} className="text-muted-foreground shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                  {item.name}
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center p-3 border-t border-border/50 hover:bg-secondary/60 transition-colors"
        >
          <ChevronLeft
            size={16}
            className={`text-muted-foreground transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
