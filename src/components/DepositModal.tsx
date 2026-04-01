import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Loader2, RefreshCw, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAddresses, registerWallet, type WalletAddresses, type WalletAddressKey } from "@/lib/walletApi";
import { QRCodeSVG } from "qrcode.react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NETWORKS = [
  { id: "bitcoin", name: "Bitcoin", primaryKey: "BTC" as WalletAddressKey, tokens: [] as WalletAddressKey[], logo: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/btc.png" },
  { id: "ethereum", name: "Ethereum (ERC-20)", primaryKey: "ETH" as WalletAddressKey, tokens: ["USDT_ERC20", "USDC_ERC20"] as WalletAddressKey[], logo: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/eth.png" },
  { id: "bnbchain", name: "BNB Chain (BEP-20)", primaryKey: "BNB" as WalletAddressKey, tokens: ["USDT_BEP20", "USDC_BEP20"] as WalletAddressKey[], logo: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/bnb.png" },
  { id: "tron", name: "Tron (TRC-20)", primaryKey: "TRX" as WalletAddressKey, tokens: ["USDT_TRC20"] as WalletAddressKey[], logo: "https://cryptologos.cc/logos/tron-trx-logo.png" },
  { id: "polygon", name: "Polygon", primaryKey: "MATIC" as WalletAddressKey, tokens: ["USDT_POLYGON", "USDC_POLYGON"] as WalletAddressKey[], logo: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/matic.png" },
  { id: "litecoin", name: "Litecoin", primaryKey: "LTC" as WalletAddressKey, tokens: [] as WalletAddressKey[], logo: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/ltc.png" },
] as const;

const COIN_META: Record<string, { name: string; symbol: string; logo: string }> = {
  BTC: { name: "Bitcoin", symbol: "BTC", logo: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/btc.png" },
  ETH: { name: "Ethereum", symbol: "ETH", logo: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/eth.png" },
  BNB: { name: "BNB", symbol: "BNB", logo: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/bnb.png" },
  LTC: { name: "Litecoin", symbol: "LTC", logo: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/ltc.png" },
  TRX: { name: "Tron", symbol: "TRX", logo: "https://cryptologos.cc/logos/tron-trx-logo.png" },
  MATIC: { name: "Polygon", symbol: "MATIC", logo: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/matic.png" },
  USDT_ERC20: { name: "USDT (ERC-20)", symbol: "USDT", logo: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/usdt.png" },
  USDT_BEP20: { name: "USDT (BEP-20)", symbol: "USDT", logo: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/usdt.png" },
  USDT_TRC20: { name: "USDT (TRC-20)", symbol: "USDT", logo: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/usdt.png" },
  USDT_POLYGON: { name: "USDT (Polygon)", symbol: "USDT", logo: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/usdt.png" },
  USDC_ERC20: { name: "USDC (ERC-20)", symbol: "USDC", logo: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/usdc.png" },
  USDC_BEP20: { name: "USDC (BEP-20)", symbol: "USDC", logo: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/usdc.png" },
  USDC_POLYGON: { name: "USDC (Polygon)", symbol: "USDC", logo: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/usdc.png" },
};

const ALL_COINS = Object.entries(COIN_META).map(([key, meta]) => ({ key: key as WalletAddressKey, ...meta }));

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DepositModal = ({ open, onOpenChange }: DepositModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [selectedCoin, setSelectedCoin] = useState<WalletAddressKey>("BTC");
  const [addresses, setAddresses] = useState<WalletAddresses | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const selectedNetwork = useMemo(() => {
    return NETWORKS.find((n) => n.primaryKey === selectedCoin || n.tokens.includes(selectedCoin));
  }, [selectedCoin]);

  const availableNetworks = useMemo(() => {
    const coin = COIN_META[selectedCoin];
    if (!coin) return [];
    return NETWORKS.filter((n) => COIN_META[n.primaryKey]?.symbol === coin.symbol || n.tokens.some((t) => COIN_META[t]?.symbol === coin.symbol));
  }, [selectedCoin]);

  const addressKey = useMemo(() => {
    if (!selectedNetwork) return selectedCoin;
    return selectedNetwork.primaryKey;
  }, [selectedCoin, selectedNetwork]);

  const address = addresses ? (addresses[addressKey] as any)?.address || (typeof addresses[addressKey] === 'string' ? addresses[addressKey] : '') : '';
  const coinMeta = COIN_META[selectedCoin];

  useEffect(() => {
    if (!open || !user) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      const username = user.user_metadata?.display_name || user.email || "user";
      try {
        const addrs = await getAddresses(user.id);
        setAddresses(addrs);
      } catch (fetchErr: any) {
        try {
          const newAddrs = await registerWallet(user.id, username);
          setAddresses(newAddrs);
        } catch (regErr: any) {
          setError(regErr.message || "Failed to load addresses");
          toast({ title: "Failed to load addresses", description: regErr.message, variant: "destructive" });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, user]);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    setError(null);
    try {
      const username = user.user_metadata?.display_name || user.email || "user";
      const newAddrs = await registerWallet(user.id, username);
      setAddresses(newAddrs);
      setCopied(false);
      toast({ title: "New address generated!" });
    } catch (err: any) {
      setError(err.message || "Failed to generate address");
      toast({ title: "Failed to generate address", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const uniqueCoins = useMemo(() => {
    const seen = new Set<string>();
    return ALL_COINS.filter((c) => {
      if (seen.has(c.symbol)) return false;
      seen.add(c.symbol);
      return true;
    });
  }, []);

  const handleCoinChange = (symbol: string) => {
    const match = ALL_COINS.find((c) => c.symbol === symbol);
    if (match) { setSelectedCoin(match.key); setCopied(false); }
  };

  const handleNetworkChange = (networkId: string) => {
    const network = NETWORKS.find((n) => n.id === networkId);
    if (!network) return;
    const currentSymbol = COIN_META[selectedCoin]?.symbol;
    const allOnNetwork = [network.primaryKey, ...network.tokens];
    const match = allOnNetwork.find((k) => COIN_META[k]?.symbol === currentSymbol);
    setSelectedCoin(match || network.primaryKey);
    setCopied(false);
  };

  const currentSymbol = COIN_META[selectedCoin]?.symbol || selectedCoin;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-hide-close className="sm:max-w-md bg-card border-border p-0 gap-0 rounded-md overflow-hidden">
        {/* Tabs */}
        <div className="flex bg-secondary/50 p-1 m-4 mb-0 rounded-md">
          <button
            onClick={() => setTab("deposit")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${
              tab === "deposit" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setTab("withdraw")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${
              tab === "withdraw" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Withdraw
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Coin selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Select Currency</label>
            <Select value={currentSymbol} onValueChange={handleCoinChange}>
              <SelectTrigger className="bg-secondary/30 border-border/50 h-12 rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {uniqueCoins.map((c) => (
                  <SelectItem key={c.symbol} value={c.symbol}>
                    <div className="flex items-center gap-2">
                      <img src={c.logo} alt={c.name} className="w-6 h-6 rounded-full" />
                      <span className="font-semibold">{c.symbol}</span>
                      <span className="text-muted-foreground text-xs">{c.name.split(' ')[0]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Network selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Select Network</label>
            <Select value={selectedNetwork?.id || ""} onValueChange={handleNetworkChange}>
              <SelectTrigger className="bg-secondary/30 border-border/50 h-12 rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableNetworks.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    <div className="flex items-center gap-2">
                      <img src={n.logo} alt={n.name} className="w-5 h-5 rounded-full" />
                      <span className="font-medium">{n.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tab === "deposit" ? (
            /* ── DEPOSIT TAB ── */
            loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="animate-spin text-primary" size={24} />
                <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : address ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Deposit Address</label>
                  <div className="flex items-center gap-2 bg-secondary/30 rounded-md p-3 border border-border/50">
                    <code className="text-xs text-foreground break-all flex-1 select-all">{address}</code>
                    <button onClick={handleCopy} className="shrink-0 p-2 rounded-md hover:bg-accent transition-colors">
                      {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} className="text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-secondary/20 rounded-md p-4 border border-border/50">
                  <div className="bg-white p-2 rounded-md shrink-0">
                    <QRCodeSVG value={address} size={120} />
                  </div>
                  <div className="flex flex-col justify-center min-h-[120px]">
                    <p className="text-sm font-semibold text-primary">
                      Send only {coinMeta?.symbol || selectedCoin} on the {selectedNetwork?.name} network.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      $15.00 minimum deposit, 1 confirmation required.
                    </p>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full gap-2 rounded-md" disabled={generating} onClick={handleGenerate}>
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
                  {generating ? "Generating…" : "Generate New Address"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                {error ? (
                  <p className="text-sm text-destructive text-center">{error}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No address found.</p>
                )}
                <Button variant="outline" size="sm" className="gap-2 rounded-md" disabled={generating} onClick={handleGenerate}>
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
                  Generate Address
                </Button>
              </div>
            )
          ) : (
            /* ── WITHDRAW TAB ── */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Withdraw Address</label>
                <div className="flex gap-2">
                  <Input
                    placeholder={`${coinMeta?.symbol || selectedCoin} Address`}
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    className="bg-secondary/30 border-border/50 h-12 rounded-md flex-1"
                  />
                  <Select defaultValue="standard">
                    <SelectTrigger className="bg-secondary/30 border-border/50 h-12 rounded-md w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Fees: Slow</SelectItem>
                      <SelectItem value="standard">Fees: Standard</SelectItem>
                      <SelectItem value="fast">Fees: Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-secondary/30 rounded-md p-4 border border-border/50 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Amount (USD)</label>
                    <div className="flex items-center bg-secondary/40 rounded-md border border-border/50 h-11">
                      <span className="px-3 text-sm text-muted-foreground border-r border-border/50">$</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="border-0 bg-transparent h-full focus-visible:ring-0"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Amount ({coinMeta?.symbol})</label>
                    <Input
                      readOnly
                      placeholder="—"
                      className="bg-secondary/40 border-border/50 h-11 rounded-md"
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full h-12 rounded-md bg-primary text-primary-foreground font-semibold text-base" disabled>
                Withdraw
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;
