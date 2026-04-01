import { Menu, Wallet, ChevronDown, Settings, LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import rakebetLogo from "@/assets/rakebet-logo-opt.webp";
import DepositModal from "@/components/DepositModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBalance } from "@/hooks/useBalance";

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [depositOpen, setDepositOpen] = useState(false);
  const { balance } = useBalance();
  const avatarUrl = user?.user_metadata?.avatar_url ?? null;
  const username = user?.user_metadata?.display_name ?? null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border h-20">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <Menu size={20} className="text-muted-foreground" />
            </button>
          </div>

          <div className="ml-2">
            <img src={rakebetLogo} alt="Rakebet" className="h-20 sm:h-24 md:h-28 -my-4" />
          </div>

          <div className="flex-1 flex justify-center">
            {!loading && user && (
              <div className="flex items-center h-10 rounded-md border border-border overflow-hidden">
                <div className="flex items-center gap-1 px-3 h-full bg-secondary/50">
                  <span className="text-sm font-semibold text-foreground">
                    ${balance !== null ? balance.toFixed(2) : "-.--"}
                  </span>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </div>
                <Button
                  size="sm"
                  className="h-full rounded-none rounded-r-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 px-4 gap-1.5"
                  onClick={() => setDepositOpen(true)}
                >
                  <Wallet size={16} />
                  Wallet
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!loading && (
              user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate("/notifications")}
                    className="relative p-2 rounded-md hover:bg-secondary transition-colors"
                  >
                    <Bell size={20} className="text-muted-foreground" />
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-full ring-2 ring-border hover:ring-primary transition-all">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={avatarUrl ?? undefined} alt="Profile" />
                          <AvatarFallback className="bg-secondary text-foreground text-sm font-bold">
                            {username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                      <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2 cursor-pointer">
                        <Settings size={16} /> Profile Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={async () => { await signOut(); navigate("/"); }}
                        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                      >
                        <LogOut size={16} /> Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="default"
                    className="border-border text-foreground hover:bg-secondary font-semibold rounded-md text-base px-5"
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </Button>
                  <Button
                    size="default"
                    className="bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 text-base px-6"
                    onClick={() => navigate('/signup')}
                  >
                    Register
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </header>

      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />
    </>
  );
};

export default Header;
