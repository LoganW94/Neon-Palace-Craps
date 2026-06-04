import { multiplayerBlueprint } from "../../shared/craps-engine.mjs";
import { CasinoSound } from "./services/sound.mjs";
import { getLobbyTables, getMultiplayerBlueprint, getProfile } from "./services/api.mjs";
import { Store } from "./state/store.mjs";
import { renderApp } from "./renderers.mjs";

const app = document.querySelector("#app");
const store = new Store();
const sound = new CasinoSound();
let snapshot = store.snapshot();

store.subscribe((next) => {
  snapshot = next;
  render();
});

setInterval(() => {
  if (snapshot.ui.page !== "table" || snapshot.ui.diceRolling) return;
  const tickEvent = store.tick();
  if (tickEvent?.type === "aiRollDue") aiRollWithAnimation();
}, 1000);

Promise.allSettled([getLobbyTables(), getProfile(), getMultiplayerBlueprint()]).then(([lobby, profile, blueprint]) => {
  store.setUi({
    lobby: lobby.value?.tables ?? [],
    profile: profile.value?.profile ?? null,
    multiplayer: blueprint.value ?? { blueprint: multiplayerBlueprint() }
  });
});

function render() {
  const rightScroll = app.querySelector(".right-rail")?.scrollTop ?? 0;
  app.innerHTML = renderApp(snapshot);
  const rightRail = app.querySelector(".right-rail");
  if (rightRail) rightRail.scrollTop = rightScroll;
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button, article[data-new-game], article[data-step], [data-bet-type]");
  if (!target) return;
  if (target.dataset.numberAction) {
    const action = target.dataset.numberAction;
    const number = Number(target.dataset.number);
    const actionEvent = action === "press"
      ? store.pressNumber(number)
      : action === "pull"
        ? store.pullNumber(number)
        : store.bet({ type: action, number });
    if (actionEvent.type === "betPlaced" || actionEvent.type === "pulled") sound.chips();
    announce(actionEvent.message);
    return;
  }
  if (target.dataset.page) {
    const gatedPages = ["table", "pokerSelect", "videoPoker", "ultimateX", "bonusPoker", "blackjack", "bar"];
    if (!snapshot.account && gatedPages.includes(target.dataset.page)) {
      store.setUi({ page: "account" });
      announce("Create an account first.");
      return;
    }
    store.setUi({ page: target.dataset.page });
  }
  if (target.hasAttribute("data-toggle-right")) store.setUi({ rightRailCollapsed: !snapshot.ui.rightRailCollapsed });
  if (target.hasAttribute("data-create-account")) {
    const username = document.querySelector("[data-account-username]")?.value ?? "Player";
    const preset = document.querySelector("[data-budget-option]:checked")?.value ?? "casual";
    store.createAccount(username, preset);
    sound.win();
    announce("Account created. Welcome to Neon Palace.");
    return;
  }
  if (target.hasAttribute("data-reset-account")) {
    if (confirm("Reset this local Neon Palace account and clear saved credits?")) {
      store.resetAccount();
      announce("Account reset.");
    }
    return;
  }
  if (target.dataset.barItem) {
    const barEvent = store.buyBarItem(target.dataset.barItem);
    if (barEvent.type !== "rejected") sound.chips();
    announce(barEvent.message);
    return;
  }
  if (target.dataset.newGame) {
    if (!snapshot.account) {
      store.setUi({ page: "account" });
      announce("Create an account first.");
      return;
    }
    store.newGame(target.dataset.newGame);
  }
  if (target.hasAttribute("data-new-video-poker")) {
    if (!snapshot.account) {
      store.setUi({ page: "account" });
      announce("Create an account first.");
      return;
    }
    store.newVideoPoker();
  }
  if (target.hasAttribute("data-new-ultimate-x")) {
    if (!snapshot.account) {
      store.setUi({ page: "account" });
      announce("Create an account first.");
      return;
    }
    store.newUltimateX();
  }
  if (target.hasAttribute("data-new-bonus-poker")) {
    if (!snapshot.account) {
      store.setUi({ page: "account" });
      announce("Create an account first.");
      return;
    }
    store.newBonusPoker();
  }
  if (target.hasAttribute("data-new-blackjack")) {
    if (!snapshot.account) {
      store.setUi({ page: "account" });
      announce("Create an account first.");
      return;
    }
    store.newBlackjack();
  }
  if (target.dataset.videoPokerAction) {
    const pokerEvent = target.dataset.videoPokerAction === "draw" ? store.videoPokerDraw() : store.videoPokerDeal();
    if (pokerEvent.type !== "rejected") target.dataset.videoPokerAction === "draw" ? sound.draw() : sound.deal();
    if (target.dataset.videoPokerAction === "draw" && pokerEvent.payout > 0) sound.win(pokerEvent.payout > 500);
    if (target.dataset.videoPokerAction === "draw" && pokerEvent.payout === 0) sound.loss();
    announce(pokerEvent.message);
    return;
  }
  if (target.hasAttribute("data-poker-hold")) {
    store.videoPokerHold(Number(target.dataset.pokerHold));
    sound.cardTap();
  }
  if (target.dataset.deucesWildAction) {
    const pokerEvent = target.dataset.deucesWildAction === "draw" ? store.ultimateXDraw() : store.ultimateXDeal();
    if (pokerEvent.type !== "rejected") target.dataset.deucesWildAction === "draw" ? sound.draw() : sound.deal();
    if (target.dataset.deucesWildAction === "draw" && pokerEvent.payout > 0) sound.win(pokerEvent.payout > 500);
    if (target.dataset.deucesWildAction === "draw" && pokerEvent.payout === 0) sound.loss();
    announce(pokerEvent.message);
    return;
  }
  if (target.hasAttribute("data-ultimate-x-hold")) {
    store.ultimateXHold(Number(target.dataset.ultimateXHold));
    sound.cardTap();
  }
  if (target.dataset.bonusPokerAction) {
    const pokerEvent = target.dataset.bonusPokerAction === "draw" ? store.bonusPokerDraw() : store.bonusPokerDeal();
    if (pokerEvent.type !== "rejected") target.dataset.bonusPokerAction === "draw" ? sound.draw() : sound.deal();
    if (target.dataset.bonusPokerAction === "draw" && pokerEvent.payout > 0) sound.win(pokerEvent.payout > 500);
    if (target.dataset.bonusPokerAction === "draw" && pokerEvent.payout === 0) sound.loss();
    announce(pokerEvent.message);
    return;
  }
  if (target.hasAttribute("data-bonus-poker-hold")) {
    store.bonusPokerHold(Number(target.dataset.bonusPokerHold));
    sound.cardTap();
  }
  if (target.hasAttribute("data-blackjack-deal")) {
    const blackjackEvent = store.blackjackDeal();
    if (blackjackEvent.type !== "rejected") sound.deal();
    if (blackjackEvent.type === "rejected") announce(blackjackEvent.message);
  }
  if (target.dataset.blackjackAction) {
    const blackjackEvent = store.blackjackAction(target.dataset.blackjackAction);
    if (blackjackEvent.type !== "rejected") sound.cardTap();
    if (blackjackEvent.outcome === "win") sound.win(blackjackEvent.payout > 500);
    if (blackjackEvent.outcome === "loss") sound.loss();
    if (blackjackEvent.type === "rejected") announce(blackjackEvent.message);
  }
  if (target.dataset.chip) {
    store.setUi({ selectedChip: Number(target.dataset.chip) });
    sound.chips();
  }
  if (target.dataset.credit) {
    store.setUi({ selectedCredit: Number(target.dataset.credit) });
    sound.chips();
  }
  if (target.dataset.betType) {
    const type = target.dataset.betType;
    const rawNumber = target.dataset.betNumber;
    const number = rawNumber && Number.isNaN(Number(rawNumber)) ? rawNumber : rawNumber ? Number(rawNumber) : null;
    const betEvent = store.bet({ type, number });
    if (betEvent.type === "betPlaced") sound.chips();
    if (betEvent.type === "rejected") announce(betEvent.message);
  }
  if (target.hasAttribute("data-roll")) rollWithAnimation();
  if (target.hasAttribute("data-ready-ai")) aiRollWithAnimation();
  if (target.hasAttribute("data-press-last-win")) {
    const pressEvent = store.pressLastWin();
    if (pressEvent.type === "betPlaced") sound.chips();
    announce(pressEvent.message);
  }
  if (target.hasAttribute("data-clear-bets")) {
    const clearEvent = store.clearBets();
    sound.chips();
    announce(clearEvent.message);
  }
  if (target.dataset.specialBet) {
    const key = target.dataset.specialBet;
    const point = snapshot.game.point;
    const bet = {
      passOdds: { type: "odds", number: point, parentType: "passLine" },
      dontPassOdds: { type: "odds", number: point, parentType: "dontPass" },
      buy6: { type: "buy", number: 6 },
      lay10: { type: "lay", number: 10 },
      dontCome: { type: "dontCome" }
    }[key];
    const betEvent = store.bet(bet);
    if (betEvent.type === "betPlaced") sound.chips();
    if (betEvent.type === "rejected") announce(betEvent.message);
  }
  if (target.dataset.step) store.setUi({ tutorialStep: Number(target.dataset.step) });
  if (target.hasAttribute("data-table-music")) {
    const enabled = !snapshot.ui.music;
    sound.toggleMusic(enabled);
    store.setUi({ music: enabled });
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target.matches("[data-ui]")) {
    const value = target.type === "range" ? Number(target.value) : target.value;
    store.setUi({ [target.dataset.ui]: value });
  }
  if (target.matches("[data-video-poker-hands]")) store.videoPokerHands(Number(target.value));
  if (target.matches("[data-ultimate-x-hands]")) store.ultimateXHands(Number(target.value));
  if (target.matches("[data-bonus-poker-hands]")) store.bonusPokerHands(Number(target.value));
  if (target.matches("[data-check]")) store.setUi({ [target.dataset.check]: target.checked });
  if (target.matches("[data-sound]")) {
    sound.toggleSound(target.checked);
    store.setUi({ sound: target.checked });
  }
  if (target.matches("[data-music]")) {
    sound.toggleMusic(target.checked);
    store.setUi({ music: target.checked });
  }
});

document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.matches("[data-ui]") && target.type === "range") {
    store.setUi({ [target.dataset.ui]: Number(target.value) });
  }
});

function rollWithAnimation() {
  if (!store.hasPlayerLineBet()) {
    announce("Place a Pass Line or Don't Pass bet before rolling.");
    return;
  }
  store.setUi({ diceRolling: true });
  sound.dice();
  setTimeout(() => {
    const event = store.roll();
    store.setUi({ diceRolling: false });
    const playerNet = playerEventNet(event);
    if (playerNet > 0) sound.win(playerNet > 200);
    if (playerNet < 0) sound.loss();
    if (playerNet > 300) celebrate();
  }, 760);
}

function aiRollWithAnimation() {
  if (snapshot.ui.diceRolling) return;
  store.setUi({ diceRolling: true });
  sound.dice();
  setTimeout(() => {
    const event = store.aiTurn();
    store.setUi({ diceRolling: false });
    const playerNet = playerEventNet(event);
    if (playerNet > 0) sound.win(playerNet > 200);
    if (playerNet < 0) sound.loss();
    if (playerNet > 300) celebrate();
  }, 760);
}

function playerEventNet(event) {
  if (!event || event.type !== "rollResolved") return event?.net ?? 0;
  const won = event.payouts
    .filter((item) => item.owner === "player")
    .reduce((sum, item) => sum + item.profit, 0);
  const lost = event.losses
    .filter((item) => item.owner === "player")
    .reduce((sum, item) => sum + item.amount, 0);
  return won - lost;
}

function celebrate() {
  const burst = document.createElement("div");
  burst.className = "confetti";
  burst.innerHTML = Array.from({ length: 36 }, (_, i) => `<i style="--x:${Math.random() * 100 - 50};--d:${Math.random() * 800 + 400}ms;--c:${i % 5}"></i>`).join("");
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 1200);
}

function announce(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2400);
}
