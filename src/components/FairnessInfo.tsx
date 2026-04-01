import { useState } from "react";
import { Scale, Copy, Check } from "lucide-react";
import type { VerificationData } from "@/lib/provablyFair";

interface FairnessInfoProps {
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  lastVerification: VerificationData | null;
  onClientSeedChange: (seed: string) => void;
  disabled?: boolean;
  gameName?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="p-2 rounded-lg hover:bg-secondary/80 transition-colors flex-shrink-0"
      title="Copy"
    >
      {copied ? (
        <Check size={16} className="text-primary" />
      ) : (
        <Copy size={16} className="text-muted-foreground" />
      )}
    </button>
  );
}

export const FairnessInfo = ({
  serverSeedHash,
  clientSeed,
  nonce,
  lastVerification,
  onClientSeedChange,
  disabled,
  gameName,
}: FairnessInfoProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Subtle corner button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/60 hover:bg-secondary/90 transition-colors text-muted-foreground hover:text-foreground"
      >
        <Scale size={14} />
        <span className="text-xs font-semibold uppercase tracking-wider">Fairness</span>
      </button>

      {/* Custom modal - no radix dialog to avoid transform issues */}
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => setOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" />
          
          {/* Panel */}
          <div
            className="relative z-10 w-full max-w-md mx-4 rounded-xl border border-border overflow-hidden shadow-2xl"
            style={{ background: "linear-gradient(135deg, hsl(229 41% 18%), hsl(226 42% 14%))" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground z-20"
            >
              ✕
            </button>

            <div className="p-6 space-y-5">
              {/* Header */}
              <div>
                {gameName && (
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {gameName}
                  </p>
                )}
                <h2 className="text-lg font-black text-foreground">Provably Fair</h2>
              </div>

              {/* Client Seed */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Client Seed
                </p>
                <div className="flex items-center gap-2 bg-secondary/40 rounded-xl px-4 py-3 min-w-0">
                  <input
                    type="text"
                    value={clientSeed}
                    onChange={(e) => onClientSeedChange(e.target.value)}
                    disabled={disabled}
                    className="flex-1 min-w-0 bg-transparent text-sm font-mono text-foreground outline-none placeholder:text-muted-foreground"
                    placeholder="Your client seed"
                  />
                  <CopyButton text={clientSeed} />
                </div>
              </div>

              {/* Server Seed (Hashed) */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Server Seed (Hashed)
                </p>
                <div className="flex items-center gap-2 bg-secondary/40 rounded-xl px-4 py-3 min-w-0">
                  <code className="flex-1 min-w-0 text-sm text-foreground/70 font-mono truncate block overflow-hidden">
                    {serverSeedHash || "–"}
                  </code>
                  {serverSeedHash && <CopyButton text={serverSeedHash} />}
                </div>
              </div>

              {/* Nonce */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Nonce
                </p>
                <div className="bg-secondary/40 rounded-xl px-4 py-3">
                  <code className="text-sm text-foreground/70 font-mono">{nonce}</code>
                </div>
              </div>

              {/* Last Verification */}
              {lastVerification && (
                <div className="border-t border-border pt-4 space-y-4">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">
                    Last Bet Verification
                  </p>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">
                      Server Seed (Revealed)
                    </p>
                    <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 min-w-0">
                      <code className="flex-1 min-w-0 text-sm text-foreground/80 font-mono truncate block overflow-hidden">
                        {lastVerification.serverSeed}
                      </code>
                      <CopyButton text={lastVerification.serverSeed} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Client Seed</p>
                      <code className="text-xs text-foreground/60 font-mono truncate block overflow-hidden">
                        {lastVerification.clientSeed}
                      </code>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Nonce</p>
                      <code className="text-xs text-foreground/60 font-mono">
                        {lastVerification.nonce}
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
