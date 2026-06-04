const ACCOUNT_KEY = "neon-palace-account-v1";

export const BANKROLL_PRESETS = {
  builder: { label: "Bankroll Builder", credits: 500, description: "Small stake, long-game discipline." },
  casual: { label: "Casual Gambler", credits: 2000, description: "Balanced casino night bankroll." },
  highRoller: { label: "High Roller", credits: 25000, description: "Big swings and deep-stack play." }
};

export const BAR_ITEMS = [
  { id: "lager", category: "Beers", name: "Neon Lager", cost: 8, description: "Crisp house lager with a clean finish. Future effect: steadier low-volatility play." },
  { id: "ipa", category: "Beers", name: "Jackpot IPA", cost: 10, description: "Bright hops and citrus bite. Future effect: slight risk appetite boost." },
  { id: "stout", category: "Beers", name: "Midnight Stout", cost: 11, description: "Dark roast, cocoa, and casino-night richness. Future effect: slower bankroll burn." },
  { id: "margarita", category: "Cocktails", name: "Royal Flush Margarita", cost: 16, description: "Lime, agave, and a salted gold rim. Future effect: video poker focus perk." },
  { id: "old-fashioned", category: "Cocktails", name: "Dealer's Old Fashioned", cost: 18, description: "Bourbon, bitters, orange, and a cherry glow. Future effect: blackjack discipline perk." },
  { id: "martini", category: "Cocktails", name: "Velvet Martini", cost: 19, description: "Cool, clean, and casino-floor classic. Future effect: premium table confidence boost." },
  { id: "sliders", category: "Food", name: "Palace Sliders", cost: 14, description: "Three mini burgers with neon sauce. Future effect: longer session stamina." },
  { id: "nachos", category: "Food", name: "Loaded Dice Nachos", cost: 13, description: "Crisp chips, cheese, jalapenos, and salsa. Future effect: craps table energy perk." },
  { id: "wings", category: "Food", name: "Hot Streak Wings", cost: 15, description: "Sweet heat wings with cooling dip. Future effect: short hot-streak bonus." }
];

export function loadAccount() {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAccount(account) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
}

export function clearAccount() {
  localStorage.removeItem(ACCOUNT_KEY);
}

export function createAccount(username, presetKey = "casual") {
  const preset = BANKROLL_PRESETS[presetKey] ?? BANKROLL_PRESETS.casual;
  const now = new Date().toISOString();
  return {
    username: String(username || "Player").trim().slice(0, 24) || "Player",
    preset: presetKey,
    startingCredits: preset.credits,
    credits: preset.credits,
    createdAt: now,
    updatedAt: now,
    stats: {
      handsPlayed: 0,
      rolls: 0,
      totalWagered: 0,
      totalWon: 0,
      totalLost: 0,
      biggestWin: 0,
      biggestLoss: 0
    },
    inventory: [],
    preferences: {}
  };
}
