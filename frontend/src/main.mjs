import { BET_CATALOG, MODES, betLabel, getPointNumbers, multiplayerBlueprint } from "../../shared/craps-engine.mjs";
import { CasinoSound } from "./services/sound.mjs";
import { getLobbyTables, getMultiplayerBlueprint, getProfile } from "./services/api.mjs";
import { Store } from "./state/store.mjs";

const app = document.querySelector("#app");
const store = new Store();
const sound = new CasinoSound();
let snapshot = store.snapshot();

store.subscribe((next) => {
  snapshot = next;
  render();
});

Promise.allSettled([getLobbyTables(), getProfile(), getMultiplayerBlueprint()]).then(([lobby, profile, blueprint]) => {
  store.setUi({
    lobby: lobby.value?.tables ?? [],
    profile: profile.value?.profile ?? null,
    multiplayer: blueprint.value ?? { blueprint: multiplayerBlueprint() }
  });
});

function render() {
  const { ui } = snapshot;
  app.innerHTML = `
    <div class="app-shell" data-page="${ui.page}">
      ${nav()}
      <main>
        ${ui.page === "home" ? home() : ""}
        ${ui.page === "tables" ? tableSelection() : ""}
        ${ui.page === "table" ? crapsTable() : ""}
        ${ui.page === "stats" ? statsDashboard() : ""}
        ${ui.page === "settings" ? settingsPage() : ""}
        ${ui.page === "tutorial" ? tutorialPage() : ""}
        ${ui.page === "lobby" ? lobbyPage() : ""}
      </main>
    </div>
  `;
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
  if (target.dataset.page) store.setUi({ page: target.dataset.page });
  if (target.dataset.newGame) {
    const bankroll = Number(prompt("Starting bankroll", MODES[target.dataset.newGame]?.bankroll ?? 2000)) || undefined;
    store.newGame(target.dataset.newGame, bankroll);
  }
  if (target.dataset.chip) {
    store.setUi({ selectedChip: Number(target.dataset.chip) });
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
  if (target.hasAttribute("data-auto-bet")) {
    store.autoBet();
    sound.chips();
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
  if (target.matches("[data-ui]")) store.setUi({ [target.dataset.ui]: target.value });
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

function rollWithAnimation() {
  store.setUi({ diceRolling: true });
  sound.dice();
  setTimeout(() => {
    const event = store.roll();
    store.setUi({ diceRolling: false });
    if (event.net > 0) sound.win(event.net > 200);
    if (event.net < 0) sound.loss();
    if (event.net > 300) celebrate();
  }, 760);
}

function nav() {
  const items = [
    ["table", "Craps Table"],
    ["stats", "Stats"],
    ["tutorial", "Help"]
  ];
  return `
    <header class="topbar">
      <button class="brand" data-page="home" aria-label="Neon Palace home">
        <span class="brand-mark">NP</span>
        <span><strong>Neon Palace</strong><small>Vegas Craps Simulator</small></span>
      </button>
      <nav>${items.map(([page, label]) => `<button class="${snapshot.ui.page === page ? "active" : ""}" data-page="${page}">${label}</button>`).join("")}</nav>
      <div class="bankroll-pill"><span>Bankroll</span><strong>${money(snapshot.game.bankroll)}</strong></div>
    </header>
  `;
}

function home() {
  return `
    <section class="hero">
      <div class="hero-backdrop"></div>
      <div class="hero-content">
        <p class="eyebrow">Downtown energy. Strip-grade math.</p>
        <h1>Neon Palace Craps</h1>
        <p>Roll authentic casino craps with visual chip stacks, animated dice, dealer calls, strategy tools, AI tablemates, and a backend designed for future real-time social play.</p>
        <div class="hero-actions">
          <button class="primary" data-new-game="casino">Play Casino Table</button>
          <button class="secondary" data-page="tutorial">Beginner Tutorial</button>
        </div>
      </div>
    </section>
    <section class="mode-strip">
      ${Object.entries(MODES).map(([key, mode]) => `
        <article class="mode-card" data-new-game="${key}">
          <strong>${mode.label}</strong>
          <span>${money(mode.bankroll)} buy-in</span>
          <small>${money(mode.min)} min / ${money(mode.max)} max</small>
        </article>
      `).join("")}
    </section>
  `;
}

function tableSelection() {
  return `
    <section class="page-band">
      <div class="section-title"><p class="eyebrow">Table selection</p><h2>Choose Your Rail</h2></div>
      <div class="table-grid">
        ${Object.entries(MODES).map(([key, mode]) => `
          <article class="casino-table-card">
            <div class="mini-table"><span></span><span></span><span></span></div>
            <h3>${mode.label}</h3>
            <p>${modeText(key)}</p>
            <div class="card-stats"><span>${money(mode.min)} min</span><span>${money(mode.max)} max</span><span>${Math.round(mode.volatility * 100)} volatility</span></div>
            <button class="primary" data-new-game="${key}">Take Seat</button>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function crapsTable() {
  const { game, ui, advice } = snapshot;
  const pass = game.bets.filter((bet) => bet.owner === "player");
  return `
    <section class="table-screen">
      <aside class="left-rail panel">
        <div class="dealer">
          <div class="dealer-avatar">D</div>
          <div><span>Dealer Call</span><strong>${game.dealer.lastCall}</strong></div>
        </div>
        <div class="dice-stage ${ui.diceRolling ? "rolling" : ""}">
          ${dice(game.rollHistory[0]?.die1 ?? 1)}
          ${dice(game.rollHistory[0]?.die2 ?? 1)}
        </div>
        <button class="roll-button" data-roll>Roll Dice</button>
        <div class="chip-rack">
          ${[5, 10, 25, 100, 500, 1000].map((chip) => `<button class="chip chip-${chip} ${ui.selectedChip === chip ? "selected" : ""}" data-chip="${chip}">${chip}</button>`).join("")}
        </div>
        <label class="select-row">Auto-bet
          <select data-ui="autoStrategy">
            ${options({ none: "Off", martingale: "Martingale", ironCross: "Iron Cross", molly: "3 Point Molly", press: "Press 6/8" }, ui.autoStrategy)}
          </select>
        </label>
        <button class="secondary" data-auto-bet>Run Strategy</button>
        <button class="secondary clear-button" data-clear-bets>Clear Removable Bets</button>
        <button class="secondary ambience-button ${ui.music ? "active" : ""}" data-table-music>${ui.music ? "Ambience On" : "Start Ambience"}</button>
        <div class="quick-bets">
          <button data-special-bet="passOdds">Pass Odds</button>
          <button data-special-bet="dontPassOdds" ${game.table.crapless ? "disabled" : ""}>Don't Odds</button>
          <button data-special-bet="dontCome" ${game.table.crapless ? "disabled" : ""}>Don't Come</button>
        </div>
      </aside>
      <div class="felt-wrap">
        <div class="table-glow"></div>
        <div class="craps-felt">
          <div class="puck ${game.point ? "on" : ""}">${game.puck}</div>
          <div class="layout-row points ${game.table.crapless ? "crapless-points" : ""}">
            ${getPointNumbers(game).map((number) => betZone("place", number, number, `Place / Buy / Lay ${number}`)).join("")}
          </div>
          <div class="layout-row lines">
            ${betZone("passLine", "", "PASS LINE", "Pass Line")}
            ${game.table.crapless ? `<button class="bet-zone disabled" title="No don't bets on Crapless Craps"><span>NO DON'T BETS</span></button>` : betZone("dontPass", "", "DON'T PASS", "Don't Pass")}
          </div>
          <div class="layout-row come">
            ${betZone("come", "", "COME", "Come")}
            ${game.table.crapless ? `<button class="bet-zone disabled" title="No don't come on Crapless Craps"><span>CRAPLESS TABLE</span></button>` : betZone("dontCome", "", "DON'T COME", "Don't Come")}
            ${fieldZone()}
          </div>
          <div class="layout-row action">
            ${["hard4", "hard6", "hard8", "hard10"].map((key) => betZone("hardways", key, key.replace("hard", "HARD "), "Hardway")).join("")}
            ${["any7", "anyCraps", "yo", "aces", "boxcars"].map((key) => betZone("proposition", key, propLabel(key), "Proposition")).join("")}
            ${betZone("big", 6, "BIG 6", "Big 6")}
            ${betZone("big", 8, "BIG 8", "Big 8")}
          </div>
          <div class="center-rail">
            <strong>Shooter: ${game.shooters[game.shooterIndex]}</strong>
            <span>${game.table.crapless ? "Crapless Craps" : "Classic Craps"} • Point ${game.point ?? "off"} • ${money(game.table.min)} min • ${game.table.oddsMultiple}x odds</span>
          </div>
        </div>
      </div>
      <aside class="right-rail panel">
        <div class="meter"><span>Profit / Loss</span><strong class="${game.bankroll - game.buyIn >= 0 ? "good" : "bad"}">${money(game.bankroll - game.buyIn)}</strong></div>
        <div class="meter"><span>Rolls</span><strong>${game.session.rolls}</strong></div>
        <div class="meter"><span>Hot / Cold</span><strong>${game.session.hotRoll} / ${game.session.coldRoll}</strong></div>
        <div class="assistant-box">
          <span>Strategy Assistant</span>
          <p>${advice}</p>
        </div>
        <div class="toggle-grid">
          <label><input type="checkbox" data-check="showProbability" ${ui.showProbability ? "checked" : ""}> Probabilities</label>
          <label><input type="checkbox" data-check="showHouseEdge" ${ui.showHouseEdge ? "checked" : ""}> House edge</label>
        </div>
        ${ui.showProbability ? probabilityPanel() : ""}
        ${ui.showHouseEdge ? houseEdgePanel() : ""}
        <h3>Player Bets</h3>
        <div class="bet-list">${pass.length ? pass.map(betItem).join("") : "<p>No chips working yet.</p>"}</div>
      </aside>
    </section>
    <section class="history-band">
      <div class="roll-history">${game.rollHistory.slice(0, 18).map((roll) => `<span class="${roll.total === 7 ? "seven" : ""}">${roll.total}</span>`).join("")}</div>
      <div class="ledger">${game.ledger.slice(0, 5).map((item) => `<span class="${item.amount >= 0 ? "good" : "bad"}">${item.label}</span>`).join("")}</div>
    </section>
  `;
}

function betZone(type, number, label, title) {
  const isNumberBox = type === "place" && number !== "";
  const bets = isNumberBox
    ? snapshot.game.bets.filter((bet) => ["place", "buy", "lay", "come", "dontCome", "odds"].includes(bet.type) && `${bet.number ?? ""}` === `${number}`)
    : snapshot.game.bets.filter((bet) => bet.type === type && `${bet.number ?? ""}` === `${number ?? ""}`);
  const isPoint = isNumberBox && snapshot.game.point === number;
  const chips = chipBreakdown(bets.reduce((sum, bet) => sum + bet.amount, 0));
  const codes = [...new Set(bets.map(chipCode).filter(Boolean))].join(" ");
  return `
    <div class="bet-zone ${type} ${isPoint ? "point-active" : ""}" data-bet-type="${type}" data-bet-number="${number ?? ""}" title="${title}" role="button" tabindex="0">
      ${isPoint ? `<em class="point-marker">ON</em>` : ""}
      <span>${label}</span>
      ${isNumberBox ? `<div class="number-controls"><button data-number-action="press" data-number="${number}">Press</button><button data-number-action="pull" data-number="${number}">Pull</button><button data-number-action="buy" data-number="${number}">Buy</button><button data-number-action="lay" data-number="${number}">Lay</button></div>` : ""}
      <div class="stack">${chips.map((chip, index) => `<i class="bet-chip chipv-${chip}" style="--stack:${index}">${chip}</i>`).join("")}${codes ? `<b>${codes}</b>` : ""}</div>
    </div>
  `;
}

function fieldZone() {
  const bets = snapshot.game.bets.filter((bet) => bet.type === "field");
  const chips = chipBreakdown(bets.reduce((sum, bet) => sum + bet.amount, 0));
  return `
    <div class="bet-zone field field-real" data-bet-type="field" data-bet-number="" title="Field" role="button" tabindex="0">
      <span class="field-title">FIELD</span>
      <div class="field-track">
        <strong>2</strong>
        <span>3</span>
        <span>4</span>
        <span>9</span>
        <span>10</span>
        <span>11</span>
        <strong>12</strong>
      </div>
      <div class="field-note"><b>2 & 12 pay double</b><em>One roll</em></div>
      <div class="stack">${chips.map((chip, index) => `<i class="bet-chip chipv-${chip}" style="--stack:${index}">${chip}</i>`).join("")}</div>
    </div>
  `;
}

function chipCode(bet) {
  return { come: "C", dontCome: "DC", odds: "O", buy: "B", lay: "L", place: "P", big: "BIG" }[bet.type] ?? "";
}

function chipBreakdown(total) {
  const chips = [];
  let remaining = total;
  [1000, 500, 100, 25, 10, 5].forEach((value) => {
    while (remaining >= value) {
      chips.push(value);
      remaining -= value;
    }
  });
  return chips.slice(0, 7);
}

function dice(value) {
  const dots = Array.from({ length: 9 }, (_, index) => {
    const visible = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8]
    }[value]?.includes(index);
    return `<b class="${visible ? "show" : ""}"></b>`;
  }).join("");
  return `<div class="die">${dots}</div>`;
}

function statsDashboard() {
  const { game } = snapshot;
  const net = game.bankroll - game.buyIn;
  const rolls = game.rollHistory.slice().reverse();
  const points = rolls.map((roll, index) => `${index * 34},${70 - Math.max(-60, Math.min(60, (roll.total - 7) * 8))}`).join(" ");
  return `
    <section class="page-band">
      <div class="section-title"><p class="eyebrow">Session intelligence</p><h2>Statistics Dashboard</h2></div>
      <div class="dashboard-grid">
        ${statCard("Net", money(net), net >= 0 ? "good" : "bad")}
        ${statCard("Total Wagered", money(game.session.totalWagered))}
        ${statCard("Points Made", game.session.pointsMade)}
        ${statCard("Seven Outs", game.session.sevenOuts)}
        ${statCard("Biggest Win", money(game.session.biggestWin), "good")}
        ${statCard("Biggest Loss", money(game.session.biggestLoss), "bad")}
      </div>
      <div class="chart-panel">
        <h3>Roll Distribution Flow</h3>
        <svg viewBox="0 0 620 120" role="img" aria-label="Roll history chart">
          <polyline points="${points || "0,70"}" />
          ${rolls.map((roll, index) => `<circle cx="${index * 34}" cy="${70 - Math.max(-60, Math.min(60, (roll.total - 7) * 8))}" r="4" />`).join("")}
        </svg>
      </div>
    </section>
  `;
}

function settingsPage() {
  const { ui } = snapshot;
  return `
    <section class="page-band narrow">
      <div class="section-title"><p class="eyebrow">Preferences</p><h2>Settings</h2></div>
      <div class="settings-stack">
        <label><span>Casino sound effects</span><input type="checkbox" data-sound ${ui.sound ? "checked" : ""}></label>
        <label><span>Background casino music</span><input type="checkbox" data-music ${ui.music ? "checked" : ""}></label>
        <label><span>Volatility profile</span><select data-ui="volatility">${options({ conservative: "Conservative", balanced: "Balanced", aggressive: "Aggressive" }, ui.volatility)}</select></label>
        <label><span>Mode</span><select data-ui="selectedMode">${options(Object.fromEntries(Object.entries(MODES).map(([key, mode]) => [key, mode.label])), ui.selectedMode)}</select></label>
        <button class="primary" data-new-game="${ui.selectedMode}">Apply New Session</button>
      </div>
      <div class="roadmap">
        <h3>Commercial Roadmap Hooks</h3>
        <p>VR-ready camera layers, mobile gesture betting, tournaments, daily challenges, achievements, progression XP, unlockable table themes, replay data, and streamer spectator overlays are represented in the architecture as separable services and UI surfaces.</p>
      </div>
    </section>
  `;
}

function tutorialPage() {
  const steps = [
    ["Come-out roll", "A 7 or 11 wins Pass Line immediately. A 2, 3, or 12 craps. Any 4, 5, 6, 8, 9, or 10 becomes the point."],
    ["Point cycle", "Once the puck is ON, the shooter tries to roll the point again before a 7. Pass Line wins on the point and loses on seven-out."],
    ["Odds bets", "Odds behind Pass, Don't Pass, Come, and Don't Come pay true mathematical odds with no house edge."],
    ["Center action", "Hardways and proposition bets are exciting but volatile. They carry higher house edges than line and odds bets."],
    ["Bankroll pressure", "Realistic pacing matters. Betting too many one-roll props can drain a session quickly even when the table feels hot."]
  ];
  return `
    <section class="page-band">
      <div class="section-title"><p class="eyebrow">Beginner tutorial</p><h2>Learn the Table</h2></div>
      <div class="tutorial-grid">
        ${steps.map(([title, body], index) => `<article class="${snapshot.ui.tutorialStep === index ? "active" : ""}" data-step="${index}"><strong>${title}</strong><p>${body}</p></article>`).join("")}
      </div>
      <button class="primary" data-new-game="tutorial">Start Guided Table</button>
    </section>
  `;
}

function lobbyPage() {
  const tables = snapshot.ui.lobby ?? [];
  const blueprint = snapshot.ui.multiplayer?.blueprint ?? multiplayerBlueprint();
  return `
    <section class="page-band">
      <div class="section-title"><p class="eyebrow">Future multiplayer</p><h2>Lobby Foundation</h2></div>
      <div class="lobby-grid">
        ${tables.map((table) => `
          <article class="lobby-row">
            <strong>${table.name}</strong>
            <span>${table.occupiedSeats}/${table.seats} seats • ${table.spectators} watching</span>
            <button class="secondary" data-new-game="${table.mode}">Preview</button>
          </article>
        `).join("")}
      </div>
      <div class="blueprint">
        <h3>Realtime Architecture</h3>
        <p>${blueprint.transport}</p>
        <div>${blueprint.events.map((event) => `<code>${event}</code>`).join("")}</div>
      </div>
    </section>
  `;
}

function probabilityPanel() {
  return `<div class="mini-panel"><strong>True Odds</strong>${snapshot.game.table.crapless ? "<span>2/12: 6:1</span><span>3/11: 3:1</span>" : ""}<span>4/10: 2:1</span><span>5/9: 3:2</span><span>6/8: 6:5</span><span>Seven frequency: 16.67%</span></div>`;
}

function houseEdgePanel() {
  return `<div class="mini-panel"><strong>House Edge</strong>${["passLine", "dontPass", "field", "hardways", "proposition"].map((key) => `<span>${BET_CATALOG[key].label}: ${BET_CATALOG[key].houseEdge}%</span>`).join("")}</div>`;
}

function betItem(bet) {
  return `<div class="bet-item"><span>${betLabel(bet)}</span><strong>${money(bet.amount)}</strong></div>`;
}

function statCard(label, value, tone = "") {
  return `<article class="stat-card ${tone}"><span>${label}</span><strong>${value}</strong></article>`;
}

function celebrate() {
  const burst = document.createElement("div");
  burst.className = "confetti";
  burst.innerHTML = Array.from({ length: 36 }, (_, i) => `<i style="--x:${Math.random() * 100 - 50};--d:${Math.random() * 800 + 400}ms;--c:${i % 5}"></i>`).join("");
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 1200);
}

function options(map, selected) {
  return Object.entries(map).map(([value, label]) => `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`).join("");
}

function modeText(key) {
  return {
    practice: "Low pressure rails, gentle limits, and a forgiving bankroll curve.",
    casino: "Authentic Strip-style pacing with balanced limits and AI tablemates.",
    crapless: "No come-out craps: 2, 3, 11, and 12 become points with richer true odds.",
    highRoller: "Higher limits, faster swings, and richer odds multiples.",
    tutorial: "Guided explanations for first-time shooters.",
    quick: "Fast action tuned for short sessions."
  }[key];
}

function announce(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2400);
}

function propLabel(key) {
  return { any7: "ANY 7", anyCraps: "ANY CRAPS", yo: "YO 11", aces: "ACES", boxcars: "BOXCARS" }[key] ?? key;
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
