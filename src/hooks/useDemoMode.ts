import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useDemoMode() {
  const { user } = useAuth();
  // Start with demo mode, but allow manual override
  const [isDemo, setIsDemo] = useState(true);
  const [manuallySet, setManuallySet] = useState(false);
  
  // Auto-detect demo mode based on authentication, but only if not manually set
  useEffect(() => {
    if (!manuallySet) {
      setIsDemo(!user);
    }
  }, [user, manuallySet]);
  
  const toggleDemo = useCallback(() => {
    setIsDemo((v) => !v);
    setManuallySet(true); // Mark as manually set to prevent auto-detection override
  }, []);
  
  return { isDemo, toggleDemo };
}
