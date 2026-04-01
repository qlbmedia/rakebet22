import { ITEM_IMAGES } from "@/assets/mm2-item-imports";
import egirlEnergy from "@/assets/mm2-cases/e-girl-energy.webp";
import compMode from "@/assets/mm2-cases/comp-mode.webp";
import cookieFortress from "@/assets/mm2-cases/cookie-fortress.webp";
import cosmicCradle from "@/assets/mm2-cases/cosmic-cradle.webp";
import cosmicVault from "@/assets/mm2-cases/cosmic-vault.webp";
import evilCraft from "@/assets/mm2-cases/evil-craft.webp";
import hollowBounty from "@/assets/mm2-cases/hollow-bounty.webp";
import loveLoot from "@/assets/mm2-cases/love-loot.webp";
import lugerVault from "@/assets/mm2-cases/luger-vault.webp";
import metroFortune from "@/assets/mm2-cases/metro-fortune.webp";
import winterWonderland from "@/assets/mm2-cases/winter-wonderland.webp";
import travellersCurse from "@/assets/mm2-cases/travellers-curse.webp";
import toxicHazard from "@/assets/mm2-cases/toxic-hazard.webp";
import luckyTune from "@/assets/mm2-cases/luckytune.webp";
import neonStrike from "@/assets/mm2-cases/neon-strike.webp";
import shadowRealm from "@/assets/mm2-cases/shadow-realm.webp";
import orbitVault from "@/assets/mm2-cases/orbit-vault.webp";
import oceansDepths from "@/assets/mm2-cases/oceans-depths.webp";
import alienAnomaly from "@/assets/mm2-cases/alien-anomaly.webp";
import burningChaos from "@/assets/mm2-cases/burning-chaos.webp";
import spectralDepths from "@/assets/mm2-cases/spectral-depths.webp";
import cherryBlossom from "@/assets/mm2-cases/cherry-blossom.webp";
import case67 from "@/assets/mm2-cases/67.webp";
import concreteChaos from "@/assets/mm2-cases/concrete-chaos.webp";
import jailsLastWish from "@/assets/mm2-cases/jailslastwish.webp";
import turkeyDay from "@/assets/mm2-cases/turkey-day.webp";
import icePiercer from "@/assets/mm2-cases/10-icepiercer.webp";
import redFront from "@/assets/mm2-cases/red-front.webp";
import vergesCurse from "@/assets/mm2-cases/verges-curse.webp";
import sugarRush from "@/assets/mm2-cases/sugar-rush.webp";
import vampiresLair from "@/assets/mm2-cases/vampires-lair.webp";
import cloudNine from "@/assets/mm2-cases/cloud-nine.webp";
import chromaJackpot from "@/assets/mm2-cases/chroma-jackpot.webp";
import noobsLuck from "@/assets/mm2-cases/noobs-luck.webp";
import royalReserve from "@/assets/mm2-cases/royal-reserve.webp";
import royalRelic from "@/assets/mm2-cases/royal-relic.webp";
import sunsetParadise from "@/assets/mm2-cases/sunset-paradise.webp";
import venomStrike from "@/assets/mm2-cases/venom-strike.webp";
import desertDominion from "@/assets/mm2-cases/desert-dominion.webp";
import voodoo from "@/assets/mm2-cases/voodoo.webp";
import ripMyGranny from "@/assets/mm2-cases/rip-my-granny.webp";
import iceboundRiches from "@/assets/mm2-cases/icebound-riches.webp";
import phantomPantry from "@/assets/mm2-cases/phantom-pantry.webp";
import elderwoodRoots from "@/assets/mm2-cases/elderwood-roots.webp";
import seerVault from "@/assets/mm2-cases/seer-vault.webp";
import pharaoh from "@/assets/mm2-cases/pharaoh.webp";
import solarFury from "@/assets/mm2-cases/solar-fury.webp";

function img(name: string): string {
  return ITEM_IMAGES[name] || `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(name)}`;
}

export interface CaseItem {
  name: string;
  value: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  imageUrl: string;
  type: "knife" | "gun" | "pet" | "accessory";
}

export interface GameCase {
  id: string;
  name: string;
  price: number;
  color: string;
  image: string;
  items: CaseItem[];
}

// ===== MASTER ITEM REGISTRY =====
// All items with their mm2values.com market values

function item(name: string, value: number, rarity: CaseItem["rarity"], type: CaseItem["type"] = "knife"): CaseItem {
  return { name, value, rarity, type, imageUrl: img(name) };
}

// Godly items
const ITEMS: Record<string, CaseItem> = {};
function r(name: string, value: number, rarity: CaseItem["rarity"], type: CaseItem["type"] = "knife") {
  ITEMS[name] = item(name, value, rarity, type);
}

// === ANCIENTS ===
r("Niks Scythe", 250000000, "legendary");
r("Gingerscope", 700, "legendary");
r("Travelers Axe", 14, "legendary");
r("Celestial", 0.5, "legendary");
r("Vampires Axe", 0.5, "epic");
r("Harvester", 0.5, "epic");
r("Icepiercer", 15, "epic");
r("Icebreaker", 1.3, "epic");
r("Elderwood Scythe", 0.5, "rare");
r("Batwing", 0.5, "rare");
r("SwirlyAxe", 0.5, "rare");
r("Hallowscythe", 0.5, "uncommon");
r("Log Chopper", 0.5, "uncommon");
r("Ice Wing", 1.35, "common");

// === GODLY HIGH ===
r("Travelers Gun", 13.5, "legendary", "gun");
r("Evergun", 12, "legendary", "gun");
r("Constellation", 0.5, "legendary");
r("Evergreen", 10.5, "legendary");
r("Turkey", 0.5, "legendary");
r("Vampires Gun", 0.5, "legendary", "gun");
r("Alienbeam", 0.5, "legendary", "gun");
r("Darkshot", 3.1, "legendary", "gun");
r("Darksword", 3, "legendary");
r("Blossom", 0.5, "legendary");
r("Sakura", 0.5, "legendary");
r("Bauble", 0.5, "legendary");
r("Raygun", 9.5, "legendary", "gun");
r("Sunrise", 0.5, "legendary");
r("Snowcannon", 0.5, "epic", "gun");
r("Soul", 2.4, "epic");
r("Spirit", 2.3, "epic");
r("Rainbow Gun", 0.5, "epic", "gun");
r("Rainbow", 0.5, "epic");
r("Sunset", 0.5, "epic");
r("Heart Wand", 0.5, "epic");
r("Flora", 0.5, "epic");
r("Treat", 0.5, "epic");
r("Sweet", 0.5, "epic");
r("Bloom", 0.5, "epic");
r("Flowerwood Gun", 0.5, "epic", "gun");
r("Flowerwood Knife", 0.5, "epic");
r("Snow Dagger", 0.5, "epic");
r("Bat", 2.2, "epic");
r("Xenoknife", 2.8, "epic");
r("Xenoshot", 2.9, "epic", "gun");
r("Ocean", 2, "epic");
r("Waves", 1.9, "epic");
r("Blizzard", 0.5, "epic");
r("Snowstorm", 0.5, "epic");
r("WaterGun", 0.5, "rare", "gun");
r("Heartblade", 0.5, "rare");
r("Candy", 0.5, "rare");
r("Borealis", 2.7, "rare");
r("Australis", 0.5, "rare");
r("Pearlshine", 1.75, "rare");
r("Luger", 0.5, "rare", "gun");
r("Sugar", 0.5, "rare");
r("Pearl", 1.8, "rare");
r("Candleflame", 0.5, "rare");
r("Elderwood Revolver", 0.5, "rare", "gun");
r("Red Luger", 0.5, "rare", "gun");
r("Makeshift", 0.5, "rare");
r("Elderwood Blade", 0.5, "rare");
r("Phantom", 2.6, "rare");
r("Spectre", 1.7, "rare");
r("Darkbringer", 0.5, "rare");
r("Iceblaster", 1.1, "rare", "gun");
r("Lightbringer", 0.5, "uncommon");
r("Ornament", 0.5, "uncommon");
r("Swirlygun", 0.58, "uncommon", "gun");
r("Green Luger", 0.5, "uncommon", "gun");
r("Laser", 0.5, "uncommon", "gun");
r("Amerilaser", 0.5, "uncommon", "gun");
r("Icebeam", 1.5, "uncommon", "gun");
r("Plasmabeam", 0.5, "uncommon", "gun");
r("Hallowgun", 0.5, "uncommon", "gun");
r("Iceflake", 0.5, "uncommon");
r("Shark", 0.5, "uncommon");
r("Plasmablade", 2.5, "uncommon");
r("Night Blade", 0.5, "uncommon");
r("Swirlyblade", 0.5, "uncommon");
r("Pixel", 0.5, "uncommon", "gun");
r("Blaster", 0.5, "uncommon", "gun");
r("Ginger Luger", 0.5, "uncommon", "gun");
r("Luger Cane", 0.5, "uncommon", "gun");
r("Old Glory", 0.5, "uncommon");
r("Slasher", 0.5, "uncommon");
r("Eternal Cane", 0.5, "uncommon");
r("Cookiecane", 0.5, "uncommon");
r("Minty", 0.68, "uncommon");
r("Gingermint", 0.5, "uncommon");
r("Jinglegun", 0.5, "uncommon", "gun");
r("Battle Axe II", 0.5, "common");
r("Virtual", 0.5, "common");
r("Gingerblade", 0.5, "common");
r("Gemstone", 0.5, "common");
r("Nebula", 0.5, "common");
r("Death Shard", 0.5, "common");
r("Vampires Edge", 0.5, "common");
r("BattleAxe", 0.5, "common");
r("Chill", 1.55, "common");
r("Clockwork", 0.5, "common");
r("Spider", 0.5, "common");
r("Heat", 0.5, "common");
r("Tides", 1.6, "common");
r("Fang", 0.5, "common");
r("Eternal", 0.5, "common");
r("Xmas", 0.5, "common");
r("Frostsaber", 0.5, "common");
r("Eternal III", 0.5, "common");
r("Bioblade", 0.5, "common");
r("Eternal IV", 0.5, "common");
r("Handsaw", 0.5, "common");
r("Hallows Edge", 0.5, "common");
r("Ice Shard", 1.45, "common");
r("Eternal II", 0.5, "common");
r("Boneblade", 0.5, "common");
r("Pumpking", 0.5, "common");
r("Saw", 0.5, "common");
r("Ghost Blade", 0.5, "common");
r("Flames", 0.5, "common");
r("Winters Edge", 0.5, "common");
r("Ice Dragon", 1.4, "common");
r("Hallows Blade", 0.5, "common");
r("Frostbite", 0.5, "common");
r("Eggblade", 0.5, "common");
r("Snowflake", 0.5, "common");
r("Prismatic", 0.5, "common");
r("Peppermint", 0.5, "common");
r("Cookieblade", 0.5, "common");
r("Red Seer", 0.5, "common");
r("Blue Seer", 0.5, "common");
r("Purple Seer", 0.5, "common");
r("Seer", 0.5, "common");
r("Orange Seer", 0.5, "common");
r("Yellow Seer", 0.5, "common");

// === CHROMAS ===
r("Chroma Travelers Gun", 2800, "legendary", "gun");
r("Chroma Evergun", 650, "legendary", "gun");
r("Chroma Evergreen", 580, "legendary");
r("Chroma Bauble", 7.2, "legendary");
r("Chroma Vampires Gun", 5.6, "legendary", "gun");
r("Chroma Constellation", 145, "legendary");
r("Chroma Alienbeam", 9, "legendary", "gun");
r("Chroma Raygun", 160, "legendary", "gun");
r("Chroma Blizzard", 6.2, "legendary");
r("Chroma Sunrise", 7.8, "legendary");
r("Chroma Treat", 7, "legendary");
r("Chroma Snowcannon", 5.8, "epic", "gun");
r("Chroma Sweet", 6.8, "epic");
r("Chroma Heart Wand", 6.5, "epic");
r("Chroma Snowstorm", 8.5, "epic");
r("Chroma Sunset", 7.5, "epic");
r("Chroma Snow Dagger", 6, "epic");
r("Chroma Ornament", 0.5, "epic");
r("Chroma WaterGun", 8, "epic", "gun");
r("Chroma Darkbringer", 5.2, "rare");
r("Chroma Lightbringer", 5, "rare");
r("Chroma Candleflame", 3.5, "rare");
r("Chroma Luger", 4.8, "rare", "gun");
r("Chroma Swirlygun", 3.7, "rare", "gun");
r("Chroma Elderwood Blade", 0.5, "rare");
r("Chroma Laser", 4.6, "uncommon", "gun");
r("Chroma Cookiecane", 3.8, "uncommon");
r("Chroma Slasher", 3.3, "uncommon");
r("Chroma DeathShard", 0.5, "uncommon");
r("Chroma Shark", 4.4, "uncommon");
r("Chroma Fang", 0.5, "uncommon");
r("Chroma Heat", 3.4, "uncommon");
r("Chroma Gemstone", 4, "uncommon");
r("Chroma Saw", 0.5, "common");
r("Chroma Tides", 0.5, "common");
r("Chroma Seer", 4.2, "common");
r("Chroma Gingerblade", 3.9, "common");
r("Chroma Boneblade", 3.6, "common");

// === VINTAGES ===
r("Ghost", 0.5, "uncommon");
r("America", 0.5, "uncommon");
r("Blood", 0.5, "uncommon");
r("Laser (Vintage)", 0.5, "uncommon", "gun");
r("Shadow", 0.5, "common");
r("Phaser", 0.5, "common");
r("Prince", 0.5, "common");
r("Golden", 0.5, "common");
r("Cowboy", 0.5, "common");
r("Splitter", 0.5, "common");

// === NEW ITEMS (not in original pools) ===
r("Corrupt", 3.2, "legendary");
r("Cotton Candy", 0.5, "rare", "gun");
r("Latte", 2.1, "rare", "gun");
r("Gingerbread", 0.5, "common", "gun");
r("JD", 0.5, "rare");
r("Niks Luger", 45000, "legendary", "gun");
r("Traveler", 0.5, "common");

// === GOLD TIER VARIANTS ===
r("Gold Niks Scythe", 10000, "legendary");
r("Gold Travelers Gun", 4200, "legendary", "gun");
r("Gold Evergun", 850, "legendary", "gun");
r("Gold Evergreen", 420, "legendary");
r("Gold Gingerscope", 3500, "legendary");
r("Gold Travelers Axe", 1950, "legendary");
r("Gold Sugar", 310, "epic");
r("Gold Candy", 220, "epic");
r("Gold Constellation", 130, "legendary");
r("Gold Celestial", 85, "legendary");
r("Gold Vampires Axe", 60, "legendary");
r("Gold Harvester", 36, "legendary");
r("Gold Icepiercer", 25, "epic");
r("Gold Icebreaker", 1.15, "epic");
r("Gold Iceblaster", 0.95, "epic", "gun");
r("Gold Log Chopper", 0.8, "rare");
r("Gold Minty", 0.72, "rare");
r("Gold Elderwood", 0.5, "epic");
r("Gold Gingerscythe", 0.55, "rare");
r("Gold Swirly", 0.65, "rare");
r("Gold Synthwave", 0.5, "epic");

// === SILVER TIER VARIANTS ===
r("Silver Niks Scythe", 3800, "legendary");
r("Silver Celestial", 78, "legendary");
r("Silver Harvester", 32, "epic");
r("Silver Constellation", 115, "legendary");
r("Silver Evergun", 0.5, "legendary", "gun");
r("Silver Evergreen", 350, "legendary");
r("Silver Vampires Axe", 52, "legendary");
r("Silver Icepiercer", 22, "epic");
r("Silver Icebreaker", 1.25, "epic");
r("Silver Sugar", 280, "rare");
r("Silver Swirly", 0.62, "rare");
r("Silver Gingerscythe", 0.52, "rare");
r("Silver Elderwood", 0.5, "rare");
r("Silver Vampires Edge", 0.5, "rare");
r("Silver Travelers Axe", 1400, "legendary");

// === BRONZE TIER VARIANTS ===
r("Bronze Celestial", 70, "legendary");
r("Bronze Constellation", 100, "legendary");
r("Bronze Harvester", 28, "epic");
r("Bronze Travelers Axe", 950, "legendary");
r("Bronze Travelers Gun", 0.5, "legendary", "gun");
r("Bronze Evergun", 480, "legendary", "gun");
r("Bronze Vampires Axe", 45, "legendary");
r("Bronze Icepiercer", 19, "epic");
r("Bronze Icebreaker", 1.2, "epic");
r("Bronze Candy", 170, "epic");
r("Bronze Elderwood", 0.5, "rare");
r("Bronze Log Chopper", 0.75, "rare");
r("Bronze Swirly", 0.6, "rare");
r("Bronze Vampires Edge", 0.5, "uncommon");

// === RED TIER VARIANTS ===
r("Red Travelers Axe", 0.5, "legendary");
r("Red Constellation", 90, "legendary");
r("Red Celestial", 65, "legendary");
r("Red Icepiercer", 18, "epic");
r("Red Iceblaster", 1, "epic", "gun");
r("Red Icecrusher", 0.85, "epic");

// === BLUE TIER VARIANTS ===
r("Blue Gingerscope", 2200, "legendary");
r("Blue Sugar", 250, "epic");
r("Blue Candy", 190, "epic");
r("Blue Harvester", 26, "epic");
r("Blue Swirly", 0.5, "rare");
r("Blue Synthwave", 0.5, "rare");
r("Blue Elderwood", 0.5, "rare");

// === PURPLE TIER VARIANTS ===
r("Purple Evergun", 520, "legendary", "gun");
r("Purple Evergreen", 380, "legendary");
r("Purple Gingerscope", 800, "legendary");
r("Purple Travelers Gun", 0.5, "legendary", "gun");
r("Purple Vampires Axe", 40, "legendary");

// === GREEN TIER VARIANT ===
r("Green Gingerscope", 750, "legendary");

// ===== HELPER =====
function pick(...names: string[]): CaseItem[] {
  return names.map(n => {
    const it = ITEMS[n];
    if (!it) console.warn(`[caseData] Unknown item: "${n}"`);
    return it;
  }).filter(Boolean);
}

function caseImg(seed: string): string {
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;
}

// ===== ALL CASES =====
export const CASES: GameCase[] = [
  {
    id: "royal-reserve", name: "Royal Reserve", price: 235, color: "45 100% 55%",
    image: royalReserve,
    items: pick("Silver Niks Scythe", "Gold Travelers Gun", "Gold Evergun", "Gold Evergreen", "Gold Sugar", "Gold Candy", "Gold Constellation", "Gold Celestial", "Silver Celestial", "Gold Vampires Axe", "Gold Harvester", "Bronze Celestial", "Gold Icepiercer", "Silver Harvester"),
  },
  {
    id: "royal-relic", name: "Royal Relic", price: 250, color: "50 95% 50%",
    image: royalRelic,
    items: pick("Gold Niks Scythe", "Gold Travelers Gun", "Gold Gingerscope", "Gold Travelers Axe", "Gold Evergun", "Gold Evergreen", "Gold Sugar", "Gold Candy", "Gold Constellation", "Gold Celestial", "Gold Harvester", "Gold Icepiercer", "Gold Icebreaker", "Gold Log Chopper", "Gold Iceblaster", "Gold Minty"),
  },
  {
    id: "chroma-jackpot", name: "Chroma Jackpot", price: 136, color: "280 85% 60%",
    image: chromaJackpot,
    items: pick("Chroma Travelers Gun", "Chroma Evergun", "Chroma Evergreen", "Chroma Raygun", "Chroma Sunrise", "Chroma WaterGun", "Chroma Sunset", "Chroma Darkbringer", "Chroma Lightbringer", "Chroma Luger", "Chroma Laser", "Chroma Shark", "Chroma Seer", "Chroma Gemstone"),
  },
  {
    id: "voodoo", name: "Voodoo", price: 116, color: "270 75% 45%",
    image: voodoo,
    items: pick("Chroma Evergun", "Purple Evergun", "Purple Evergreen", "Travelers Axe", "Chroma Alienbeam", "Chroma Snowstorm", "Travelers Gun", "Evergun", "Evergreen", "Raygun", "Harvester", "Alienbeam", "Corrupt"),
  },
  {
    id: "pharaoh", name: "Pharaoh", price: 98, color: "40 90% 50%",
    image: pharaoh,
    items: pick("Gold Travelers Axe", "Bronze Travelers Axe", "Bronze Evergun", "Gold Sugar", "Gold Constellation", "Gold Celestial", "Bronze Constellation", "Gold Harvester", "Bronze Celestial", "Gold Icepiercer", "Corrupt", "Gold Elderwood", "Gold Log Chopper"),
  },
  {
    id: "desert-dominion", name: "Desert Dominion", price: 87, color: "35 85% 50%",
    image: desertDominion,
    items: pick("Gold Travelers Axe", "Red Travelers Axe", "Gold Constellation", "Gold Celestial", "Gold Vampires Axe", "Gold Harvester", "Bronze Celestial", "Bronze Icepiercer", "Gold Icebreaker", "Gold Iceblaster", "Gold Gingerscythe", "Gold Log Chopper", "Gold Minty"),
  },
  {
    id: "solar-fury", name: "Solar Fury", price: 67, color: "15 95% 55%",
    image: solarFury,
    items: pick("Bronze Travelers Gun", "Red Travelers Axe", "Travelers Axe", "Gold Harvester", "Travelers Gun", "Bronze Celestial", "Red Constellation", "Red Celestial", "Vampires Gun", "Vampires Axe", "Bronze Elderwood", "Heat", "Flames"),
  },
  {
    id: "cosmic-cradle", name: "Cosmic Cradle", price: 59, color: "260 80% 55%",
    image: cosmicCradle,
    items: pick("Purple Gingerscope", "Chroma Vampires Gun", "Purple Evergun", "Chroma Raygun", "Chroma Constellation", "Gold Constellation", "Gold Celestial", "Chroma Alienbeam", "Chroma Sunrise", "Raygun", "Alienbeam", "Candleflame", "Nebula"),
  },
  {
    id: "comp-mode", name: "Comp Mode", price: 55, color: "140 80% 45%",
    image: compMode,
    items: pick("Green Gingerscope", "Chroma Evergreen", "Chroma Raygun", "Travelers Axe", "Chroma Snowstorm", "Travelers Gun", "Evergun", "Evergreen", "Raygun", "Harvester", "Alienbeam", "Chroma Darkbringer", "Green Luger"),
  },
  {
    id: "hollow-bounty", name: "Hollow Bounty", price: 50, color: "20 70% 40%",
    image: hollowBounty,
    items: pick("Bronze Travelers Axe", "Chroma Vampires Gun", "Chroma Raygun", "Chroma Constellation", "Bronze Candy", "Travelers Axe", "Bronze Constellation", "Gold Harvester", "Travelers Gun", "Bronze Celestial", "Xenoshot", "Xenoknife"),
  },
  {
    id: "venom-strike", name: "Venom Strike", price: 48, color: "120 70% 35%",
    image: venomStrike,
    items: pick("Chroma Evergun", "Red Travelers Axe", "Travelers Axe", "Chroma Alienbeam", "Chroma Snowstorm", "Evergun", "Evergreen", "Raygun", "Corrupt", "Harvester", "Alienbeam", "Borealis", "Phantom"),
  },
  {
    id: "travelers-curse", name: "Traveler's Curse", price: 77, color: "30 75% 45%",
    image: travellersCurse,
    items: pick("Chroma Travelers Gun", "Gold Travelers Axe", "Silver Travelers Axe", "Bronze Travelers Axe", "Travelers Axe", "Gold Harvester", "Travelers Gun", "Gold Icebreaker", "Corrupt", "Darkshot", "Darksword", "Elderwood Scythe", "Elderwood Revolver", "Battle Axe II"),
  },
  {
    id: "cosmic-vault", name: "Cosmic Vault", price: 43, color: "250 85% 55%",
    image: cosmicVault,
    items: pick("Chroma Raygun", "Chroma Constellation", "Gold Constellation", "Gold Celestial", "Silver Constellation", "Silver Celestial", "Bronze Constellation", "Bronze Celestial", "Raygun", "Celestial", "Constellation", "Alienbeam", "Nebula"),
  },
  {
    id: "love-vault", name: "Love Vault", price: 34, color: "330 90% 65%",
    image: loveLoot,
    items: pick("Chroma Bauble", "Chroma Treat", "Chroma Sweet", "Chroma Heart Wand", "Blossom", "Sakura", "Heart Wand", "Bauble", "Treat", "Sweet", "Heartblade", "Cotton Candy"),
  },
  {
    id: "icebound-riches", name: "Icebound Riches", price: 41, color: "200 90% 60%",
    image: iceboundRiches,
    items: pick("Silver Evergreen", "Chroma Constellation", "Silver Celestial", "Chroma Blizzard", "Chroma Snow Dagger", "Silver Icepiercer", "Snowcannon", "Constellation", "Celestial", "Silver Icebreaker", "Icepiercer", "Icebreaker", "Iceflake"),
  },
  {
    id: "orbit-vault", name: "Orbit Vault", price: 82, color: "220 80% 55%",
    image: orbitVault,
    items: pick("Niks Luger", "Blue Gingerscope", "Chroma Snowcannon", "Chroma Raygun", "Blue Sugar", "Chroma Alienbeam", "Silver Celestial", "Blue Candy", "Chroma Snow Dagger", "Silver Icepiercer", "Snowcannon", "Snow Dagger", "Phantom", "Plasmablade"),
  },
  {
    id: "rip-my-granny", name: "RIP My Granny", price: 38, color: "350 80% 40%",
    image: ripMyGranny,
    items: pick("Chroma Vampires Gun", "Purple Travelers Gun", "Gold Vampires Axe", "Silver Vampires Axe", "Bronze Vampires Axe", "Bronze Harvester", "Purple Vampires Axe", "Corrupt", "Vampires Gun", "Darkshot", "Darksword", "Xenoknife"),
  },
  {
    id: "evil-craft", name: "Evil Craft", price: 33, color: "0 85% 40%",
    image: evilCraft,
    items: pick("Red Travelers Axe", "Travelers Axe", "Chroma Alienbeam", "Gold Harvester", "Travelers Gun", "Evergun", "Evergreen", "Raygun", "Corrupt", "Gold Elderwood", "Harvester", "Alienbeam", "Soul"),
  },
  {
    id: "metro-fortune", name: "Metro Fortune", price: 29, color: "210 70% 50%",
    image: metroFortune,
    items: pick("Silver Evergun", "Silver Sugar", "Silver Constellation", "Silver Celestial", "Silver Vampires Axe", "Silver Harvester", "Silver Icepiercer", "Corrupt", "Darkshot", "Darksword", "Silver Swirly", "Silver Gingerscythe", "Soul"),
  },
  {
    id: "cookie-fortress", name: "Cookie Fortress", price: 106, color: "25 80% 50%",
    image: cookieFortress,
    items: pick("Gold Gingerscope", "Gingerscope", "Evergun", "Evergreen", "Corrupt", "Chroma Gingerblade", "Ginger Luger", "Gingerbread", "Chroma Cookiecane"),
  },
  {
    id: "lucky-tune", name: "Lucky Tune", price: 26, color: "170 75% 50%",
    image: luckyTune,
    items: pick("Blue Gingerscope", "Chroma Evergreen", "Gingerscope", "Chroma Sunrise", "Chroma Sunset", "Constellation", "Blue Harvester", "Celestial", "Icepiercer", "Gold Synthwave", "Flowerwood Gun", "Flowerwood Knife", "Blue Swirly", "Blue Synthwave", "Chill"),
  },
  {
    id: "spectral-depths", name: "Spectral Depths", price: 24, color: "270 70% 50%",
    image: spectralDepths,
    items: pick("Purple Travelers Gun", "Chroma Alienbeam", "Chroma WaterGun", "Raygun", "Purple Vampires Axe", "Alienbeam", "Elderwood Scythe", "Xenoshot", "Xenoknife", "JD"),
  },
  {
    id: "phantom-pantry", name: "Phantom Pantry", price: 22, color: "30 70% 45%",
    image: phantomPantry,
    items: pick("Gingerscope", "Turkey", "Corrupt", "Bauble", "Candy", "Gold Log Chopper", "Latte", "Gold Minty", "Chroma Gingerblade", "Sugar", "Cookiecane", "Ginger Luger"),
  },
  {
    id: "concrete-chaos", name: "Concrete Chaos", price: 20, color: "140 60% 40%",
    image: concreteChaos,
    items: pick("Chroma Evergun", "Chroma Evergreen", "Evergun", "Evergreen", "Harvester", "Flora", "Bloom", "Green Luger", "Eternal III", "Seer"),
  },
  {
    id: "cherry-blossom", name: "Cherry Blossom", price: 19, color: "340 85% 65%",
    image: cherryBlossom,
    items: pick("Chroma Bauble", "Chroma Sunrise", "Blossom", "Sakura", "Bauble", "Flora", "Bloom", "Flowerwood Gun", "Flowerwood Knife", "Heartblade"),
  },
  {
    id: "sunset-paradise", name: "Sunset Paradise", price: 120, color: "20 95% 55%",
    image: sunsetParadise,
    items: pick("Chroma Travelers Gun", "Chroma Bauble", "Chroma Sunrise", "Bronze Celestial", "Chroma Sunset", "Turkey", "Sunrise", "Sunset"),
  },
  {
    id: "alien-anomaly", name: "Alien Anomaly", price: 18, color: "160 80% 45%",
    image: alienAnomaly,
    items: pick("Chroma Raygun", "Chroma Constellation", "Chroma Alienbeam", "Chroma Sunset", "Raygun", "Constellation", "Celestial", "Alienbeam", "Xenoshot", "Xenoknife", "Phantom", "Green Luger", "Bioblade", "Seer"),
  },
  {
    id: "winter-wonderland", name: "Winter Wonderland", price: 17, color: "195 85% 60%",
    image: winterWonderland,
    items: pick("Chroma Evergun", "Chroma Evergreen", "Gingerscope", "Evergun", "Evergreen", "Bauble", "Gold Swirly", "Icepiercer", "Flowerwood Gun", "Flowerwood Knife", "Icebreaker", "Sugar", "Swirlygun", "Iceflake", "Ice Wing"),
  },
  {
    id: "verges-curse", name: "Verge's Curse", price: 16, color: "0 80% 45%",
    image: vergesCurse,
    items: pick("Red Travelers Axe", "Silver Constellation", "Silver Icepiercer", "Red Constellation", "Bronze Harvester", "Red Celestial", "Vampires Gun", "Red Icepiercer", "Vampires Axe", "Red Icecrusher", "Red Iceblaster", "Darkbringer", "Batwing", "Blood"),
  },
  {
    id: "jails-last-wish", name: "Jail's Last Wish", price: 15, color: "0 0% 30%",
    image: jailsLastWish,
    items: pick("Chroma Travelers Gun", "Travelers Axe", "Travelers Gun", "Silver Vampires Axe", "Silver Harvester", "Turkey", "Darkshot", "Darksword", "Bat", "Soul", "Spirit", "Night Blade", "Battle Axe II", "Spider", "BattleAxe", "Traveler"),
  },
  {
    id: "e-girl-energy", name: "E-girl Energy", price: 14, color: "300 80% 65%",
    image: egirlEnergy,
    items: pick("Blue Gingerscope", "Gingerscope", "Travelers Axe", "Blossom", "Sakura", "Bauble", "Flora", "Heartblade", "Chroma Lightbringer", "Purple Seer"),
  },
  {
    id: "cloud-nine", name: "Cloud Nine", price: 13, color: "200 75% 65%",
    image: cloudNine,
    items: pick("Chroma Bauble", "Chroma Sunrise", "Bauble", "Rainbow Gun", "Rainbow", "Candy", "Gold Minty", "Heartblade", "Chroma Lightbringer", "Chroma Swirlygun", "Chroma Cookiecane", "Lightbringer", "Cotton Candy", "Chroma Boneblade", "Gingermint", "Minty"),
  },
  {
    id: "vampairs-lair", name: "Vampairs Lair", price: 12, color: "350 75% 35%",
    image: vampiresLair,
    items: pick("Red Travelers Axe", "Bronze Harvester", "Vampires Gun", "Vampires Axe", "Elderwood Scythe", "Batwing", "Darkbringer", "Elderwood Revolver", "Spider"),
  },
  {
    id: "toxic-hazard", name: "Toxic Hazard", price: 11, color: "100 85% 40%",
    image: toxicHazard,
    items: pick("Raygun", "Harvester", "Alienbeam", "Chroma Darkbringer", "Green Luger", "Bioblade"),
  },
  {
    id: "red-front", name: "Red Front", price: 10, color: "0 85% 45%",
    image: redFront,
    items: pick("Bronze Harvester", "Red Celestial", "Gold Icebreaker", "Corrupt", "Darkshot", "Red Icepiercer", "Vampires Gun", "Vampires Axe", "Harvester", "Bat", "Red Iceblaster", "Red Luger", "Darkbringer", "Batwing", "Slasher", "Fang", "Blood"),
  },
  {
    id: "turkey-day", name: "Turkey Day", price: 9, color: "25 75% 45%",
    image: turkeyDay,
    items: pick("Turkey", "Bronze Icebreaker", "Bat", "Latte", "Bronze Log Chopper", "Swirlygun", "Eggblade", "Orange Seer"),
  },
  {
    id: "shadow-realm", name: "Shadow Realm", price: 9, color: "0 0% 20%",
    image: shadowRealm,
    items: pick("Silver Vampires Axe", "Silver Harvester", "Silver Icepiercer", "Silver Icebreaker", "Darkshot", "Darksword", "Soul", "Spirit", "Silver Vampires Edge", "Elderwood Scythe", "Elderwood Revolver", "Night Blade", "BattleAxe", "Eternal"),
  },
  {
    id: "sugar-rush", name: "Sugar Rush", price: 8, color: "330 85% 60%",
    image: sugarRush,
    items: pick("Chroma Bauble", "Bauble", "Bronze Swirly", "Candy", "Sugar", "Chroma Swirlygun", "Red Luger", "Chroma Cookiecane", "Cotton Candy", "Gingermint", "Luger Cane", "Minty"),
  },
  {
    id: "elderwood-roots", name: "Elderwood Roots", price: 8, color: "140 55% 30%",
    image: elderwoodRoots,
    items: pick("Gold Elderwood", "Silver Elderwood", "Bronze Elderwood", "Blue Elderwood", "Elderwood Scythe", "Elderwood Blade", "Chroma Elderwood Blade", "Elderwood Revolver"),
  },
  {
    id: "ocean-depths", name: "Ocean Depths", price: 7, color: "210 85% 50%",
    image: oceansDepths,
    items: pick("Blue Gingerscope", "Chroma WaterGun", "Ocean", "Waves", "Flowerwood Gun", "Flowerwood Knife", "Pearl", "Pearlshine", "Spectre", "Phantom", "Tides"),
  },
  {
    id: "noobs-luck", name: "Noob's Luck", price: 6, color: "90 75% 50%",
    image: noobsLuck,
    items: pick("Harvester", "Bat", "WaterGun", "Chroma Luger", "Chroma Seer", "Chroma Gemstone", "Hallowgun", "Seer", "Blue Seer", "Yellow Seer"),
  },
  {
    id: "ice-piercer", name: "Ice Piercer", price: 6, color: "195 90% 55%",
    image: icePiercer,
    items: pick("Gold Icepiercer", "Silver Icepiercer", "Bronze Icepiercer", "Icepiercer", "Iceflake", "Icebeam", "Ice Shard", "Ice Wing", "Ice Dragon"),
  },
  {
    id: "case-67", name: "Case 67", price: 5, color: "200 80% 55%",
    image: case67,
    items: pick("Gold Icepiercer", "Icepiercer", "Ocean", "Waves", "Flowerwood Gun", "Flowerwood Knife", "Icebreaker", "Pearl", "Tides", "Chill", "Ice Wing", "Blue Seer"),
  },
  {
    id: "burning-chaos", name: "Burning Chaos", price: 5, color: "10 90% 50%",
    image: burningChaos,
    items: pick("Gold Vampires Axe", "Red Iceblaster", "Chroma Darkbringer", "Chroma Candleflame", "Candleflame", "Red Luger", "Darkbringer", "Batwing", "Bronze Vampires Edge", "Chroma Heat", "Laser", "Heat", "Fang", "Flames", "Orange Seer"),
  },
  {
    id: "neon-strike", name: "Neon Strike", price: 4, color: "280 90% 55%",
    image: neonStrike,
    items: pick("Chroma Raygun", "Gold Synthwave", "Chroma Laser", "Chroma Slasher", "Blue Synthwave", "Laser", "Plasmabeam", "Amerilaser", "Blaster", "Virtual", "Slasher", "Frostsaber", "Phaser"),
  },
  {
    id: "luger-vault", name: "Luger Vault", price: 3, color: "220 70% 45%",
    image: lugerVault,
    items: pick("Corrupt", "Chroma Luger", "Luger", "Red Luger", "Green Luger", "Luger Cane", "Ginger Luger"),
  },
  {
    id: "seer-vault", name: "Seer Vault", price: 3, color: "260 75% 55%",
    image: seerVault,
    items: pick("Chroma Seer", "Seer", "Purple Seer", "Blue Seer", "Yellow Seer", "Orange Seer"),
  },
];

// ===== RARITY STYLING =====
export const RARITY_COLORS: Record<string, string> = {
  common: "200 15% 55%",
  uncommon: "140 60% 45%",
  rare: "210 80% 55%",
  epic: "280 80% 60%",
  legendary: "45 100% 55%",
};

export const RARITY_HEX: Record<string, string> = {
  common: "#8899a6",
  uncommon: "#2ecc71",
  rare: "#3498db",
  epic: "#9b59b6",
  legendary: "#f1c40f",
};

// ===== PICK RANDOM ITEM =====
export function pickRandomItem(caseData: GameCase, roll?: number): CaseItem {
  const weights: Record<string, number> = { common: 50, uncommon: 25, rare: 15, epic: 8, legendary: 2 };
  const items = caseData.items;
  const totalWeight = items.reduce((sum, i) => sum + (weights[i.rarity] || 1), 0);
  let r = (roll !== undefined ? roll : Math.random()) * totalWeight;
  for (const item of items) {
    r -= weights[item.rarity] || 1;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}
