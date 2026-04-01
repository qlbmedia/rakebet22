import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import gemImg from "@/assets/gem-optimized.webp";
import mineImg from "@/assets/mine-optimized.webp";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Preload game assets so they're cached instantly */}
      <div className="hidden" aria-hidden="true">
        <img src={gemImg} alt="" />
        <img src={mineImg} alt="" />
      </div>

      <Header onToggleSidebar={() => {
        if (window.innerWidth < 1024) {
          setSidebarOpen(!sidebarOpen);
        } else {
          setSidebarCollapsed(!sidebarCollapsed);
        }
      }} />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main
        className={`relative z-10 pt-16 md:pt-20 transition-all duration-200 pb-16 lg:pb-0
          ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-52"}
        `}
      >
        {children}
      </main>

      <MobileNav />
      {!user && !loading && <AuthModal />}
    </div>
  );
};

export default Layout;
