import { clearWorkingBets, createInitialState, placeBet, pressNumberBet, pullNumberBets, resolveRoll, rollDice, strategyRecommendation } from "../../../shared/craps-engine.mjs";

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
    const result = resolveRoll(this.game, rollDice());
    this.game = result.state;
    this.ui = { ...this.ui, lastEvent: result.event };
    this.emit();
    return result.event;
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

  emit() {
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
