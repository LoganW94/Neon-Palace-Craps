import { clearWorkingBets, createInitialState, placeAiStrategyBets, placeBet, pressNumberBet, pullNumberBets, resolveRoll, rollDice, strategyRecommendation } from "../../../shared/craps-engine.mjs";
import { blackjackPlayerAction, createBlackjackState, createUltimateXState, createVideoPokerState, dealUltimateX, dealVideoPoker, drawUltimateX, drawVideoPoker, setUltimateXHands, setVideoPokerHands, startBlackjackHand, toggleUltimateXHold, toggleVideoPokerHold } from "../../../shared/casino-games.mjs";
import { clearAccount, createAccount as buildAccount, loadAccount, saveAccount } from "../services/accountStorage.mjs";

const AI_TURN_MS = 30000;
const PERSISTED_UI_KEYS = ["selectedCredit", "selectedChip", "selectedMode", "sound", "music", "showProbability", "showHouseEdge", "hudDock", "controlsDock", "infoDock", "uiScale"];

export class Store {
  constructor() {
    this.listeners = new Set();
    this.account = loadAccount();
    const accountCredits = this.account?.credits ?? 0;
    this.ui = {
      page: this.account ? "home" : "account",
      selectedChip: 25,
      selectedCredit: 0.25,
      selectedMode: "casino",
      sound: true,
      music: false,
      showProbability: true,
      showHouseEdge: true,
      rightRailCollapsed: false,
      hudDock: "top",
      controlsDock: "bottom",
      infoDock: "right",
      uiScale: 0.72,
      turnEndsAt: null,
      turnSeconds: null,
      nextAiActionAt: null,
      lastWinningNumber: null,
      lastWinningNumberType: null,
      volatility: "balanced",
      diceRolling: false,
      tutorialStep: 0,
      lastEvent: null,
      lobby: [],
      profile: null,
      ...(this.account?.preferences ?? {})
    };
    this.game = this.withPlayerName(createInitialState("casino", accountCredits || 2000));
    this.videoPoker = createVideoPokerState(accountCredits || 1000);
    this.ultimateX = createUltimateXState(accountCredits || 1500);
    this.blackjack = createBlackjackState(accountCredits || 2000);
    this.ensureAiFieldBets();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  snapshot() {
    return { ui: this.ui, account: this.account, game: this.game, videoPoker: this.videoPoker, ultimateX: this.ultimateX, blackjack: this.blackjack, advice: strategyRecommendation(this.game) };
  }

  setUi(patch) {
    this.ui = { ...this.ui, ...patch };
    this.persistPreferences(patch);
    this.emit();
  }

  createAccount(username, preset) {
    this.account = buildAccount(username, preset);
    this.account.preferences = this.pickPreferences(this.ui);
    this.game = this.withPlayerName(createInitialState("casino", this.account.credits));
    this.videoPoker = createVideoPokerState(this.account.credits);
    this.ultimateX = createUltimateXState(this.account.credits);
    this.blackjack = createBlackjackState(this.account.credits);
    saveAccount(this.account);
    this.ui = { ...this.ui, page: "home", lastEvent: null };
    this.emit();
  }

  resetAccount() {
    clearAccount();
    this.account = null;
    this.game = createInitialState("casino", 2000);
    this.videoPoker = createVideoPokerState(1000);
    this.ultimateX = createUltimateXState(1500);
    this.blackjack = createBlackjackState(2000);
    this.ui = { ...this.ui, page: "account", lastEvent: null };
    this.emit();
  }

  newGame(mode = this.ui.selectedMode, bankroll) {
    this.game = this.withPlayerName(createInitialState(mode, this.account?.credits ?? bankroll));
    this.ui = { ...this.ui, selectedMode: mode, page: "table", lastEvent: null };
    this.resetTurnClock();
    this.ensureAiFieldBets();
    this.emit();
  }

  newVideoPoker(bankroll = this.videoPoker.bankroll || 1000) {
    this.videoPoker = createVideoPokerState(this.account?.credits ?? bankroll);
    this.ui = { ...this.ui, page: "videoPoker", lastEvent: null };
    this.emit();
  }

  videoPokerDeal() {
    const result = dealVideoPoker(this.videoPoker, this.ui.selectedCredit, this.videoPoker.hands);
    this.videoPoker = result.state;
    this.ui = { ...this.ui, lastEvent: result.event };
    this.syncAccountFrom("videoPoker");
    this.emit();
    return result.event;
  }

  videoPokerHold(index) {
    this.videoPoker = toggleVideoPokerHold(this.videoPoker, index);
    this.emit();
  }

  videoPokerHands(hands) {
    this.videoPoker = setVideoPokerHands(this.videoPoker, hands);
    this.emit();
  }

  videoPokerDraw() {
    const result = drawVideoPoker(this.videoPoker);
    this.videoPoker = result.state;
    this.ui = { ...this.ui, lastEvent: result.event };
    this.syncAccountFrom("videoPoker");
    this.emit();
    return result.event;
  }

  newUltimateX(bankroll = this.ultimateX.bankroll || 1500) {
    this.ultimateX = createUltimateXState(this.account?.credits ?? bankroll);
    this.ui = { ...this.ui, page: "ultimateX", lastEvent: null };
    this.emit();
  }

  ultimateXDeal() {
    const result = dealUltimateX(this.ultimateX, this.ui.selectedCredit, this.ultimateX.hands);
    this.ultimateX = result.state;
    this.ui = { ...this.ui, lastEvent: result.event };
    this.syncAccountFrom("ultimateX");
    this.emit();
    return result.event;
  }

  ultimateXHold(index) {
    this.ultimateX = toggleUltimateXHold(this.ultimateX, index);
    this.emit();
  }

  ultimateXHands(hands) {
    this.ultimateX = setUltimateXHands(this.ultimateX, hands);
    this.emit();
  }

  ultimateXDraw() {
    const result = drawUltimateX(this.ultimateX);
    this.ultimateX = result.state;
    this.ui = { ...this.ui, lastEvent: result.event };
    this.syncAccountFrom("ultimateX");
    this.emit();
    return result.event;
  }

  newBlackjack(bankroll = this.blackjack.bankroll || 2000) {
    this.blackjack = createBlackjackState(this.account?.credits ?? bankroll);
    this.ui = { ...this.ui, page: "blackjack", lastEvent: null };
    this.emit();
  }

  blackjackDeal() {
    const result = startBlackjackHand(this.blackjack, this.ui.selectedChip);
    this.blackjack = result.state;
    this.ui = { ...this.ui, lastEvent: result.event };
    this.syncAccountFrom("blackjack");
    this.emit();
    return result.event;
  }

  blackjackAction(action) {
    const result = blackjackPlayerAction(this.blackjack, action);
    this.blackjack = result.state;
    this.ui = { ...this.ui, lastEvent: result.event };
    this.syncAccountFrom("blackjack");
    this.emit();
    return result.event;
  }

  bet(bet) {
    const result = placeBet(this.game, { ...bet, amount: this.ui.selectedChip });
    this.game = result.state;
    this.ui = { ...this.ui, lastEvent: result.event };
    this.syncAccountFrom("game");
    this.emit();
    return result.event;
  }

  clearBets() {
    this.game = clearWorkingBets(this.game);
    this.ui = { ...this.ui, lastEvent: { type: "cleared", message: this.game.dealer.lastCall } };
    this.syncAccountFrom("game");
    this.emit();
    return this.ui.lastEvent;
  }

  pressNumber(number) {
    const result = pressNumberBet(this.game, number, this.ui.selectedChip);
    this.game = result.state;
    this.ui = { ...this.ui, lastEvent: result.event };
    this.syncAccountFrom("game");
    this.emit();
    return result.event;
  }

  pullNumber(number) {
    const result = pullNumberBets(this.game, number);
    this.game = result.state;
    this.ui = { ...this.ui, lastEvent: result.event };
    this.syncAccountFrom("game");
    this.emit();
    return result.event;
  }

  roll() {
    if (!this.isHumanShooter()) {
      const shooter = this.currentShooter();
      const event = { type: "rejected", message: `${shooter.name} has the dice right now.` };
      this.ui = { ...this.ui, lastEvent: event };
      this.emit();
      return event;
    }
    if (!this.hasPlayerLineBet()) {
      const event = { type: "rejected", message: "Place a Pass Line or Don't Pass bet before rolling." };
      this.ui = { ...this.ui, lastEvent: event };
      this.emit();
      return event;
    }
    const result = resolveRoll(this.placeAiFieldBets(), rollDice());
    this.game = result.state;
    this.ui = { ...this.ui, lastEvent: result.event, ...lastWinningNumberPatch(result.event) };
    this.syncAccountFrom("game");
    this.resetTurnClock();
    this.ensureAiFieldBets();
    this.emit();
    return result.event;
  }

  aiTurn() {
    const shooter = this.currentShooter();
    if (!shooter || shooter.human) return null;
    const rollResult = resolveRoll(this.placeAiFieldBets(), rollDice());
    this.game = rollResult.state;
    this.ui = { ...this.ui, lastEvent: rollResult.event, ...lastWinningNumberPatch(rollResult.event) };
    this.syncAccountFrom("game");
    this.resetTurnClock();
    this.ensureAiFieldBets();
    this.emit();
    return rollResult.event;
  }

  tick(now = Date.now()) {
    const shooter = this.currentShooter();
    if (!shooter) return;
    if (shooter.human) {
      if (this.ui.turnSeconds !== null || this.ui.nextAiActionAt !== null) {
        this.ui = { ...this.ui, turnEndsAt: null, turnSeconds: null, nextAiActionAt: null };
        this.emit();
      }
      return null;
    }
    const turnSeconds = Math.max(0, Math.ceil(((this.ui.nextAiActionAt ?? now) - now) / 1000));
    if (now >= (this.ui.nextAiActionAt ?? now + AI_TURN_MS)) {
      return { type: "aiRollDue" };
    }
    if (turnSeconds !== this.ui.turnSeconds) {
      this.ui = { ...this.ui, turnSeconds };
      this.emit();
    }
    return null;
  }

  pressLastWin() {
    if (!this.ui.lastWinningNumber) {
      const event = { type: "rejected", message: "No winning number bet to press yet." };
      this.ui = { ...this.ui, lastEvent: event };
      this.emit();
      return event;
    }
    const amount = Math.max(this.game.table.min, this.ui.selectedChip);
    const result = placeBet(this.game, {
      type: this.ui.lastWinningNumberType ?? "place",
      number: this.ui.lastWinningNumber,
      amount
    });
    this.game = result.state;
    this.ui = { ...this.ui, lastEvent: result.event };
    this.emit();
    return result.event;
  }

  currentShooter() {
    return this.game.players?.[this.game.shooterIndex] ?? { id: "player", name: this.game.shooters?.[this.game.shooterIndex] ?? "You", human: this.game.shooterIndex === 0 };
  }

  isHumanShooter() {
    return Boolean(this.currentShooter()?.human);
  }

  hasPlayerLineBet() {
    return this.game.bets.some((bet) => bet.owner === "player" && ["passLine", "dontPass"].includes(bet.type));
  }

  resetTurnClock(now = Date.now()) {
    const shooter = this.currentShooter();
    this.ui = {
      ...this.ui,
      turnEndsAt: shooter?.human ? null : now + AI_TURN_MS,
      turnSeconds: shooter?.human ? null : Math.ceil(AI_TURN_MS / 1000),
      nextAiActionAt: shooter?.human ? null : now + AI_TURN_MS
    };
  }

  placeAiFieldBets() {
    let nextGame = this.game;
    nextGame.players
      ?.filter((player) => !player.human)
      .forEach((player) => {
        nextGame = placeAiStrategyBets(nextGame, player.id).state;
      });
    this.game = nextGame;
    return nextGame;
  }

  ensureAiFieldBets() {
    this.placeAiFieldBets();
  }

  syncAccountFrom(source) {
    if (!this.account) return;
    const credits = this[source]?.bankroll;
    if (typeof credits !== "number") return;
    this.account = {
      ...this.account,
      credits: Math.round(credits * 100) / 100,
      updatedAt: new Date().toISOString()
    };
    saveAccount(this.account);
    this.refreshIdleBalances(source);
  }

  persistPreferences(patch) {
    if (!this.account) return;
    if (!Object.keys(patch).some((key) => PERSISTED_UI_KEYS.includes(key))) return;
    this.account = {
      ...this.account,
      preferences: this.pickPreferences(this.ui),
      updatedAt: new Date().toISOString()
    };
    saveAccount(this.account);
  }

  pickPreferences(ui) {
    return Object.fromEntries(PERSISTED_UI_KEYS.map((key) => [key, ui[key]]));
  }

  refreshIdleBalances(source) {
    const credits = this.account?.credits;
    if (typeof credits !== "number") return;
    if (source !== "game" && this.game.bets.length === 0) {
      this.game.bankroll = credits;
      this.game.players = this.game.players?.map((player) => player.id === "player" ? { ...player, bankroll: credits } : player);
    }
    if (source !== "videoPoker" && this.videoPoker.status !== "dealt") this.videoPoker.bankroll = credits;
    if (source !== "ultimateX" && this.ultimateX.status !== "dealt") this.ultimateX.bankroll = credits;
    if (source !== "blackjack" && this.blackjack.status !== "player") this.blackjack.bankroll = credits;
  }

  withPlayerName(game) {
    const username = this.account?.username;
    if (!username) return game;
    return {
      ...game,
      shooters: game.shooters.map((name, index) => index === 0 ? username : name),
      players: game.players.map((player) => player.id === "player" ? { ...player, name: username } : player)
    };
  }

  emit() {
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

function lastWinningNumberPatch(event) {
  const payout = event?.payouts?.find((item) => item.owner === "player" && ["place", "buy", "big"].includes(item.type) && item.number);
  return payout ? { lastWinningNumber: payout.number, lastWinningNumberType: payout.type === "buy" ? "buy" : "place" } : {};
}
