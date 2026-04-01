import minesCover from "@/assets/mines-cover.png";
import plinkoCover from "@/assets/plinko-cover.png";
import kenoCover from "@/assets/keno-cover.png";
import limboCover from "@/assets/limbo-cover.png";
import casesCover from "@/assets/cases-cover.png";

export interface Game {
  id: string;
  name: string;
  provider: string;
  category: string[];
  isNew?: boolean;
  isHot?: boolean;
  rtp?: number;
  players?: number;
  color1: string;
  color2: string;
  image?: string;
  link?: string;
}

// Colors for game card gradients (no emojis)
const c = {
  red: ["#dc2626", "#991b1b"],
  orange: ["#ea580c", "#9a3412"],
  amber: ["#d97706", "#92400e"],
  green: ["#16a34a", "#166534"],
  teal: ["#0d9488", "#115e59"],
  blue: ["#2563eb", "#1e40af"],
  indigo: ["#4f46e5", "#3730a3"],
  purple: ["#9333ea", "#6b21a8"],
  pink: ["#db2777", "#9d174d"],
  slate: ["#475569", "#1e293b"],
};

export const games: Game[] = [
  { id: "cases", name: "Cases", provider: "Rakebet Originals", category: ["originals"], color1: c.purple[0], color2: c.purple[1], image: casesCover, link: "/cases" },
  { id: "3", name: "Plinko", provider: "Rakebet Originals", category: ["originals", "trending"], rtp: 98, players: 654, color1: c.green[0], color2: c.green[1], image: plinkoCover, link: "/plinko" },
  { id: "4", name: "Mines", provider: "Rakebet Originals", category: ["originals"], rtp: 97, players: 431, color1: c.amber[0], color2: c.amber[1], image: minesCover, link: "/mines" },
  { id: "5", name: "Limbo", provider: "Rakebet Originals", category: ["originals"], rtp: 99, players: 302, color1: c.purple[0], color2: c.purple[1], image: limboCover, link: "/limbo" },
  { id: "7", name: "Keno", provider: "Rakebet Originals", category: ["originals"], rtp: 96, players: 156, color1: c.indigo[0], color2: c.indigo[1], image: kenoCover, link: "/keno" },
];

export const liveBets = [
  { user: "LuckyAce", game: "Plinko", amount: 891, multiplier: "8.2x", time: "5s ago" },
  { user: "SatoshiFan", game: "Mines", amount: 340, multiplier: "5.2x", time: "15s ago" },
  { user: "HighRoller", game: "Limbo", amount: 3300, multiplier: "4.8x", time: "28s ago" },
  { user: "CaseHunter", game: "Cases", amount: 1250, multiplier: "3.1x", time: "32s ago" },
  { user: "KenoKing", game: "Keno", amount: 680, multiplier: "12.5x", time: "45s ago" },
];

export const promos = [
  {
    id: 1,
    title: "100% Deposit Bonus",
    subtitle: "Double your first deposit up to $1,000",
    cta: "Claim Now",
  },
  {
    id: 2,
    title: "Rakeback Enabled",
    subtitle: "Earn back a % of every bet you place",
    cta: "Learn More",
  },
  {
    id: 3,
    title: "Weekly Cashback",
    subtitle: "Get up to 25% cashback every week",
    cta: "View Details",
  },
];

export const categories = [
  { id: "all", label: "All" },
  { id: "originals", label: "Originals" },
  { id: "trending", label: "Trending" },
];
