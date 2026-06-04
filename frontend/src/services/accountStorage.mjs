const ACCOUNT_KEY = "neon-palace-account-v1";

export const BANKROLL_PRESETS = {
  builder: { label: "Bankroll Builder", credits: 500, description: "Small stake, long-game discipline." },
  casual: { label: "Casual Gambler", credits: 2000, description: "Balanced casino night bankroll." },
  highRoller: { label: "High Roller", credits: 25000, description: "Big swings and deep-stack play." }
};

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
    preferences: {}
  };
}
