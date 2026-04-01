import { useState, useCallback, useEffect, useRef } from "react";
import { generateSeed, hashSeed, type VerificationData } from "@/lib/provablyFair";

export interface FairnessState {
  clientSeed: string;
  serverSeedHash: string;
  nonce: number;
  /** The current (hidden) server seed — used internally for game logic */
  serverSeed: string;
  /** Last bet's revealed verification data */
  lastVerification: VerificationData | null;
}

export function useProvablyFair() {
  const [clientSeed, setClientSeed] = useState(() => generateSeed().slice(0, 16));
  const [serverSeed, setServerSeed] = useState("");
  const [serverSeedHash, setServerSeedHash] = useState("");
  const [nonce, setNonce] = useState(0);
  const [lastVerification, setLastVerification] = useState<VerificationData | null>(null);
  const initializedRef = useRef(false);

  // Generate initial server seed
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const seed = generateSeed();
    setServerSeed(seed);
    hashSeed(seed).then(setServerSeedHash);
  }, []);

  /** Call after each bet resolves to rotate the server seed */
  const rotateSeed = useCallback(async () => {
    const oldSeed = serverSeed;
    const oldHash = serverSeedHash;
    const currentNonce = nonce;

    // Reveal the old seed
    setLastVerification({
      serverSeed: oldSeed,
      serverSeedHash: oldHash,
      clientSeed,
      nonce: currentNonce,
    });

    // Generate new seed for next bet
    const newSeed = generateSeed();
    setServerSeed(newSeed);
    setServerSeedHash(await hashSeed(newSeed));
    setNonce((n) => n + 1);
  }, [serverSeed, serverSeedHash, clientSeed, nonce]);

  /** Let user change their client seed */
  const updateClientSeed = useCallback((seed: string) => {
    setClientSeed(seed || generateSeed().slice(0, 16));
    setNonce(0);
  }, []);

  return {
    clientSeed,
    serverSeed,
    serverSeedHash,
    nonce,
    lastVerification,
    rotateSeed,
    updateClientSeed,
  };
}
