import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { registerWallet } from "@/lib/walletApi";
import { supabase } from "@/lib/supabase";
import crownImg from "@/assets/rakebet-crown.png";

const AuthModal = () => {
  const [tab, setTab] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, name);
    if (error) {
      setLoading(false);
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      return;
    }
    try {
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) await registerWallet(newUser.id, name);
    } catch (err) {
      console.warn("Wallet registration deferred:", err);
    }
    setLoading(false);
    toast({ title: "Account created!", description: "Welcome to Rakebet!" });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setLoading(false);
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      return;
    }
    setLoading(false);
  };

  return (
    <Dialog open={true}>
      <DialogContent
        className="max-w-[900px] w-[95vw] p-0 border-border/50 bg-card overflow-hidden gap-0 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex min-h-[520px]">
          {/* Left panel — image */}
          <div className="hidden md:flex w-1/2 relative flex-col overflow-hidden">
            <div className="absolute inset-0">
              <img
                src={crownImg}
                alt="Rakebet"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="relative z-10 text-[11px] text-white/50 text-center leading-relaxed mt-auto p-4">
              By accessing the site, I attest that I am at least 18 years old
              and have read the Terms and Conditions
            </p>
          </div>

          {/* Right panel — form */}
          <div className="flex-1 flex flex-col p-8">
            {/* Tabs */}
            <div className="flex gap-6 mb-8 border-b border-border/40">
              <button
                onClick={() => setTab("login")}
                className={`pb-3 text-sm font-semibold transition-colors relative ${
                  tab === "login"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                Login
                {tab === "login" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                )}
              </button>
              <button
                onClick={() => setTab("register")}
                className={`pb-3 text-sm font-semibold transition-colors relative ${
                  tab === "register"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                Register
                {tab === "register" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                )}
              </button>
            </div>

            {tab === "register" ? (
              <form onSubmit={handleRegister} className="flex flex-col gap-4 flex-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Username
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Choose a username"
                    className="bg-background/60 border-border/40 h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="bg-background/60 border-border/40 h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="bg-background/60 border-border/40 h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11 mt-2 font-semibold" disabled={loading}>
                  {loading ? "Creating account…" : "Create Account"}
                </Button>
                <p className="text-[11px] text-muted-foreground/60 text-center mt-auto md:hidden">
                  By accessing the site, I attest that I am at least 18 years old
                  and have read the Terms and Conditions
                </p>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="flex flex-col gap-4 flex-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="bg-background/60 border-border/40 h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="bg-background/60 border-border/40 h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11 mt-2 font-semibold" disabled={loading}>
                  {loading ? "Signing in…" : "Sign In"}
                </Button>
                <p className="text-[11px] text-muted-foreground/60 text-center mt-auto md:hidden">
                  By accessing the site, I attest that I am at least 18 years old
                  and have read the Terms and Conditions
                </p>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
