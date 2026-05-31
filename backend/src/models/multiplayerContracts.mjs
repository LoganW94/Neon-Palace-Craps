export const MultiplayerContracts = {
  table: {
    id: "string",
    name: "string",
    mode: "practice | casino | highRoller | tournament",
    seats: "PlayerSeat[]",
    spectators: "Spectator[]",
    gameState: "CrapsGameState",
    chatChannelId: "string"
  },
  playerProfile: {
    id: "string",
    displayName: "string",
    xp: "number",
    bankrollVault: "number",
    achievements: "Achievement[]",
    friends: "PlayerProfile[]",
    tableThemeUnlocks: "string[]"
  },
  realtimeEvents: [
    "lobby.snapshot",
    "table.created",
    "table.joined",
    "bet.placed",
    "dice.rolled",
    "dealer.called",
    "chat.message",
    "spectator.joined",
    "profile.updated"
  ]
};
