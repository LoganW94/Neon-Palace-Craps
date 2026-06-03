import { clearWorkingBets, createInitialState, placeAiFieldBet, placeBet, pressNumberBet, pullNumberBets, resolveRoll, rollDice, strategyRecommendation } from "../../../shared/craps-engine.mjs";

const AI_TURN_MS = 30000;

export class Store {
  constructor() {
    this.listeners = new Set();
    this.ui = {
      page: "home",
      selectedChip: 25,
      selectedMode: "casino",
      sound: true,
      music: false,
      showProbability: true,
      showHouseEdge: true,
      rightRailCollapsed: false,
      uiScale: 0.9,
      turnEndsAt: null,
      turnSeconds: null,
      nextAiActionAt: null,
      volatility: "balanced",
      autoStrategy: "none",
      diceRolling: false,
      tutorialStep: 0,
      lastEvent: null,
      lobby: [],
      profile: null
    };
    this.game = createInitialState("casino", 2000);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  snapshot() {
    return { ui: this.ui, game: this.game, advice: strategyRecommendation(this.game) };
  }

  setUi(patch) {
    this.ui = { ...this.ui, ...patch };
    this.emit();
  }

  newGame(mode = this.ui.selectedMode, bankroll) {
    this.game = createInitialState(mode, bankroll);
    this.ui = { ...this.ui, selectedMode: mode, page: "table", lastEvent: null };
    this.resetTurnClock();
    this.emit();
  }

  bet(bet) {
    const result = placeBet(this.game, { ...bet, amount: this.ui.selectedChip });
    this.game = result.state;
    this.ui = { ...this.ui, lastEvent: result.event };
    this.emit();
    return result.event;
  }

  clearBets() {
    this.game = clearWorkingBets(this.game);
    this.ui = { ...this.ui, lastEvent: { type: "cleared", message: this.game.dealer.lastCall } };
    this.emit();
    return this.ui.lastEvent;
  }

  pressNumber(number) {
    const result = pressNumberBet(this.game, number, this.ui.selectedChip);
    this.game = result.state;
    this.ui = { ...this.ui, lastEvent: result.event };
    this.emit();
    return result.event;
  }

  pullNumber(number) {
    const result = pullNumberBets(this.game, number);
    this.game = result.state;
    this.ui = { ...this.ui, lastEvent: result.event };
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
    const result = resolveRoll(this.placeAiFieldBets(), rollDice());
    this.game = result.state;
    this.ui = { ...this.ui, lastEvent: result.event };
    this.resetTurnClock();
    this.emit();
    return result.event;
  }

  aiTurn() {
    const shooter = this.currentShooter();
    if (!shooter || shooter.human) return null;
    const rollResult = resolveRoll(this.placeAiFieldBets(), rollDice());
    this.game = rollResult.state;
    this.ui = { ...this.ui, lastEvent: rollResult.event };
    this.resetTurnClock();
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

  autoBet() {
    const unit = this.ui.selectedChip;
    const strategy = this.ui.autoStrategy;
    if (strategy === "none") return [];
    const bets = [];
    const add = (bet) => {
      this.ui.selectedChip = bet.amount ?? unit;
      bets.push(this.bet(bet));
    };
    if (strategy === "martingale") add({ type: this.game.point ? "come" : "passLine", amount: Math.min(unit * Math.max(1, Math.abs(this.game.session.streak)), this.game.table.max) });
    if (strategy === "ironCross") [{ type: "field" }, { type: "place", number: 5 }, { type: "place", number: 6 }, { type: "place", number: 8 }].forEach(add);
    if (strategy === "molly") [{ type: "passLine" }, { type: "come" }, { type: "come" }].forEach(add);
    if (strategy === "press") [{ type: "place", number: 6 }, { type: "place", number: 8 }].forEach(add);
    this.ui.selectedChip = unit;
    return bets;
  }

  currentShooter() {
    return this.game.players?.[this.game.shooterIndex] ?? { id: "player", name: this.game.shooters?.[this.game.shooterIndex] ?? "You", human: this.game.shooterIndex === 0 };
  }

  isHumanShooter() {
    return Boolean(this.currentShooter()?.human);
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
        nextGame = placeAiFieldBet(nextGame, player.id).state;
      });
    this.game = nextGame;
    return nextGame;
  }

  emit() {
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
