import { useState, useMemo } from "react";

import HeroBanner from "@/components/home/HeroBanner";
import CategoryFilters from "@/components/home/CategoryFilters";
import GameGrid from "@/components/home/GameGrid";

import RewardBanner from "@/components/home/RewardBanner";
import { games } from "@/data/mockData";
import { Zap, Sparkles, TrendingUp, BarChart3 } from "lucide-react";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGames = useMemo(() => {
    let result = games;
    if (activeCategory !== "all") {
      result = result.filter((g) => g.category.includes(activeCategory));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (g) => g.name.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, searchQuery]);

  const trendingGames = useMemo(() => games.filter((g) => g.category.includes("trending")), []);
  const newGames = useMemo(() => games.filter((g) => g.isNew), []);
  const originals = useMemo(() => games.filter((g) => g.category.includes("originals")), []);
  const highRtp = useMemo(() => games.filter((g) => g.category.includes("high-rtp")), []);

  const showSections = activeCategory === "all" && !searchQuery;

  return (
    <>
      <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
        
        <HeroBanner />
        <RewardBanner />
        <CategoryFilters
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {showSections ? (
          <div className="space-y-8">
            <GameGrid title="Originals" games={originals} icon={<Zap size={18} className="text-primary" />} />
            <GameGrid title="Trending Games" games={trendingGames} icon={<TrendingUp size={18} className="text-primary" />} />
            <GameGrid title="New Releases" games={newGames} icon={<Sparkles size={18} className="text-primary" />} />
            <GameGrid title="High RTP" games={highRtp} icon={<BarChart3 size={18} className="text-primary" />} />
          </div>
        ) : (
          <GameGrid
            title={activeCategory === "all" ? "Search Results" : `${activeCategory.replace("-", " ")} Games`}
            games={filteredGames}
          />
        )}
      </div>
    </>
  );
};

export default Index;
