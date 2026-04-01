import { useState, useEffect, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { BalanceProvider } from "@/hooks/useBalance";
import SplashScreen from "@/components/SplashScreen";
import { preloadCaseImages, preloadItemImagesInBackground } from "@/lib/preloadAssets";
import Layout from "./components/layout/Layout.tsx";
import Index from "./pages/Index.tsx";
import Cases from "./pages/Cases.tsx";
import CaseOpening from "./pages/CaseOpening.tsx";
import MinesPage from "./pages/Mines.tsx";
import LimboPage from "./pages/Limbo.tsx";
import PlinkoPage from "./pages/Plinko.tsx";
import KenoPage from "./pages/Keno.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import Profile from "./pages/Profile.tsx";
import Notifications from "./pages/Notifications.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => {
  const [ready, setReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    preloadCaseImages().then(() => setReady(true));
  }, []);

  const handleSplashFinished = useCallback(() => {
    setSplashDone(true);
    preloadItemImagesInBackground();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        {!splashDone && <SplashScreen onFinished={handleSplashFinished} />}

        <BrowserRouter>
          <AuthProvider>
            <BalanceProvider>
              <Layout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/cases" element={<Cases />} />
                  <Route path="/cases/:slug" element={<CaseOpening />} />
                  <Route path="/mines" element={<MinesPage />} />
                  <Route path="/limbo" element={<LimboPage />} />
                  <Route path="/plinko" element={<PlinkoPage />} />
                  <Route path="/keno" element={<KenoPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </BalanceProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
