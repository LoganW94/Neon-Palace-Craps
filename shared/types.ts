export type GameMode = "practice" | "casino" | "crapless" | "highRoller" | "tutorial" | "quick";
export type PlayerRole = "shooter" | "player" | "spectator" | "dealer" | "moderator";

export interface CrapsBet {
  id: string;
  owner: string;
  type: string;
  amount: number;
  number?: number | string | null;
  parentType?: "passLine" | "dontPass" | "come" | "dontCome" | null;
  contract: boolean;
}

export interface RealtimeTableEvent {
  id: string;
  type:
    | "lobby.snapshot"
    | "table.join"
    | "table.leave"
    | "bet.place"
    | "bet.remove"
    | "dice.roll"
    | "dealer.call"
    | "chat.message"
    | "spectator.join"
    | "profile.update";
  tableId?: string;
  playerId?: string;
  payload: unknown;
  at: string;
}

export interface PlayerProfile {
  id: string;
  displayName: string;
  xp: number;
  level: number;
  achievements: string[];
  friends: string[];
  tableThemeUnlocks: string[];
}
