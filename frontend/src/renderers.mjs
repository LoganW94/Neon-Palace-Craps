import { BET_CATALOG, MODES, betLabel, getPointNumbers, multiplayerBlueprint } from "../../shared/craps-engine.mjs";
import { BONUS_POKER_PAYTABLE, DEUCES_WILD_ULTIMATE_X_PAYTABLE, JACKS_OR_BETTER_PAYTABLE, blackjackGuide, blackjackOddsSummary, handValue } from "../../shared/casino-games.mjs";
import { BANKROLL_PRESETS, BAR_ITEMS } from "./services/accountStorage.mjs";

let snapshot;

export function renderApp(nextSnapshot) {
  snapshot = nextSnapshot;
  const { ui } = snapshot;
  return `
    <div class="app-shell" data-page="${ui.page}" style="--ui-scale:${ui.uiScale ?? 0.72}">
      ${nav()}
      <main>
        ${ui.page === "home" ? home() : ""}
        ${ui.page === "account" ? accountPage() : ""}
        ${ui.page === "tables" ? tableSelection() : ""}
        ${ui.page === "table" ? crapsTable() : ""}
        ${ui.page === "pokerSelect" ? pokerSelectPage() : ""}
        ${ui.page === "videoPoker" ? videoPokerGame() : ""}
        ${ui.page === "ultimateX" ? ultimateXGame() : ""}
        ${ui.page === "bonusPoker" ? bonusPokerGame() : ""}
        ${ui.page === "blackjack" ? blackjackGame() : ""}
        ${ui.page === "bar" ? barPage() : ""}
        ${ui.page === "stats" ? statsDashboard() : ""}
        ${ui.page === "settings" ? settingsPage() : ""}
        ${ui.page === "tutorial" ? tutorialPage() : ""}
        ${ui.page === "lobby" ? lobbyPage() : ""}
      </main>
    </div>
  `;
}

function nav() {
  const items = [
    ["table", "Craps"],
    ["pokerSelect", "Video Poker"],
    ["blackjack", "Blackjack"],
    ["bar", "Bar"],
    ["account", "Account"],
    ["settings", "Settings"],
    ["stats", "Stats"],
    ["multiplayer-disabled", "Multiplayer"]
  ];
  return `
    <header class="topbar">
      <button class="brand" data-page="home" aria-label="Neon Palace home">
        <span class="brand-mark">NP</span>
        <span><strong>Neon Palace</strong><small>Casino Game Floor</small></span>
      </button>
      <nav>${items.map(([page, label]) => page === "multiplayer-disabled"
        ? `<button class="disabled-nav" title="Multiplayer is not available yet" disabled>${label}</button>`
        : `<button class="${snapshot.ui.page === page ? "active" : ""}" data-page="${page}">${label}</button>`).join("")}</nav>
      <div class="bankroll-pill"><span>${snapshot.account?.username ?? "Account"}</span><strong>${snapshot.account ? activeBankrollLabel() : "Create"}</strong></div>
    </header>
  `;
}

function home() {
  return `
    <section class="hero">
      <div class="hero-backdrop"></div>
      <div class="hero-content">
        <p class="eyebrow">Neon tables. Real odds. Palace energy.</p>
        <h1>Neon Palace Casino</h1>
        <p>Choose a game from the floor: immersive craps, Jacks or Better video poker, or blackjack with live strategy guidance.</p>
        ${snapshot.account ? `<p class="account-welcome">Signed in as <strong>${snapshot.account.username}</strong> with ${credits(snapshot.account.credits)} credits.</p>` : `<p class="account-welcome">Create a local account to save credits and casino progress.</p>`}
        <div class="home-menu casino-floor-menu">
          <button class="home-tile primary-tile game-tile craps-tile" data-new-game="${snapshot.ui.selectedMode}">
            <strong>Craps</strong>
            <span>${MODES[snapshot.ui.selectedMode]?.label ?? "Casino Simulation"} • full Vegas table</span>
          </button>
          <button class="home-tile game-tile poker-tile" data-page="pokerSelect">
            <strong>Video Poker</strong>
            <span>Choose Jacks or Better, Deuces Wild, or Bonus Poker</span>
          </button>
          <button class="home-tile game-tile blackjack-tile" data-new-blackjack>
            <strong>Blackjack</strong>
            <span>3:2 blackjack, dealer stands soft 17, and guided recommended plays</span>
          </button>
          <button class="home-tile game-tile bar-tile" data-page="bar">
            <strong>Bar</strong>
            <span>Future social hub, comps, boosts, and casino RPG events</span>
          </button>
          <button class="home-tile" data-page="settings">
            <strong>Settings</strong>
            <span>Sound, ambience, table preferences, chips, and credit size</span>
          </button>
          <button class="home-tile" data-page="stats">
            <strong>Stats</strong>
            <span>Craps session results, streaks, roll history, and credits</span>
          </button>
          <button class="home-tile unavailable" disabled title="Multiplayer is not available yet">
            <strong>Multiplayer</strong>
            <span>Coming later</span>
          </button>
        </div>
      </div>
    </section>
  `;
}

function accountPage() {
  const account = snapshot.account;
  if (!account) {
    return `
      <section class="page-band narrow account-page">
        <div class="section-title"><p class="eyebrow">Local profile</p><h2>Create Player</h2></div>
        <div class="account-panel">
          <label><span>Username</span><input data-account-username maxlength="24" placeholder="Player name"></label>
          <div class="budget-grid">
            ${Object.entries(BANKROLL_PRESETS).map(([key, preset], index) => `
              <label class="budget-card ${index === 1 ? "selected" : ""}">
                <input type="radio" name="budget" data-budget-option value="${key}" ${index === 1 ? "checked" : ""}>
                <strong>${preset.label}</strong>
                <b>${credits(preset.credits)}</b>
                <span>${preset.description}</span>
              </label>
            `).join("")}
          </div>
          <button class="primary" data-create-account>Create Account</button>
        </div>
      </section>
    `;
  }
  const profit = account.credits - account.startingCredits;
  return `
    <section class="page-band narrow account-page">
      <div class="section-title"><p class="eyebrow">Account settings</p><h2>${account.username}</h2></div>
      <div class="account-panel">
        <div class="dashboard-grid">
          ${statCard("Credits", credits(account.credits), account.credits >= account.startingCredits ? "good" : "bad")}
          ${statCard("Starting Budget", credits(account.startingCredits))}
          ${statCard("Profit / Loss", credits(profit), profit >= 0 ? "good" : "bad")}
          ${statCard("Archetype", BANKROLL_PRESETS[account.preset]?.label ?? "Custom")}
        </div>
        <div class="roadmap">
          <h3>RPG Foundation</h3>
          <p>This local profile now gives Neon Palace one persistent credit balance across every game. It can later support XP, rewards, achievements, player ratings, and luck/skill comparisons.</p>
        </div>
        <button class="secondary danger-button" data-reset-account>Reset Account</button>
      </div>
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

function pokerSelectPage() {
  return `
    <section class="page-band">
      <div class="section-title"><p class="eyebrow">Video poker room</p><h2>Choose a Machine</h2></div>
      <div class="table-grid">
        <article class="casino-table-card poker-tile">
          <div class="mini-table"><span></span><span></span><span></span></div>
          <h3>Jacks or Better</h3>
          <p>Classic five-card draw with full-pay style returns and straightforward strategy.</p>
          <div class="card-stats"><span>1-10 hands</span><span>5¢ min</span><span>Low variance</span></div>
          <button class="primary" data-new-video-poker>Play Jacks or Better</button>
        </article>
        <article class="casino-table-card ultimate-tile">
          <div class="mini-table"><span></span><span></span><span></span></div>
          <h3>Deuces Wild</h3>
          <p>Deuces are wild, premium hands swing big, and trips are the minimum payout.</p>
          <div class="card-stats"><span>1-10 hands</span><span>5¢ min</span><span>High variance</span></div>
          <button class="primary" data-new-ultimate-x>Play Deuces Wild</button>
        </article>
        <article class="casino-table-card bonus-tile">
          <div class="mini-table"><span></span><span></span><span></span></div>
          <h3>Bonus Poker</h3>
          <p>Classic draw poker with bigger payouts for four aces and low quads.</p>
          <div class="card-stats"><span>1-10 hands</span><span>5¢ min</span><span>Medium variance</span></div>
          <button class="primary" data-new-bonus-poker>Play Bonus Poker</button>
        </article>
      </div>
    </section>
  `;
}

function crapsTable() {
  const { game, ui, advice } = snapshot;
  const pass = game.bets.filter((bet) => bet.owner === "player");
  const currentBetTotal = game.bets.reduce((sum, bet) => sum + bet.amount, 0);
  const playerBetTotal = pass.reduce((sum, bet) => sum + bet.amount, 0);
  const shooter = game.players?.[game.shooterIndex] ?? { name: game.shooters[game.shooterIndex], human: game.shooterIndex === 0 };
  const playerTurn = Boolean(shooter.human);
  const groups = [
    ["hud", ui.hudDock, `
      <div class="table-hud panel dock-panel">
        <div class="dealer">
          <div class="dealer-avatar">D</div>
          <div><span>Dealer Call</span><strong>${game.dealer.lastCall}</strong></div>
        </div>
        <div class="dice-stage ${ui.diceRolling ? "rolling" : ""}">
          ${dice(game.rollHistory[0]?.die1 ?? 1)}
          ${dice(game.rollHistory[0]?.die2 ?? 1)}
        </div>
        <button class="roll-button" ${playerTurn ? "data-roll" : "data-ready-ai"}>${playerTurn ? "Roll Dice" : "Ready"}</button>
        ${betSlip(playerBetTotal, shooter)}
      </div>
    `],
    ["leaderboard", ui.infoDock, leaderboard()],
    ["info", ui.infoDock, `
      <aside class="right-rail panel dock-panel ${ui.rightRailCollapsed ? "collapsed" : ""}">
        <button class="rail-toggle" data-toggle-right title="${ui.rightRailCollapsed ? "Show info" : "Hide info"}">${ui.rightRailCollapsed ? "Info" : "Hide"}</button>
        <div class="right-rail-body">
          <div class="meter"><span>Profit / Loss</span><strong class="${game.bankroll - game.buyIn >= 0 ? "good" : "bad"}">${money(game.bankroll - game.buyIn)}</strong></div>
          <div class="meter"><span>Current Bets</span><strong>${money(currentBetTotal)}</strong></div>
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
        </div>
      </aside>
    `],
    ["controls", ui.controlsDock, `
      <aside class="left-rail panel dock-panel">
        <div class="chip-rack">
          ${[5, 10, 25, 100, 500, 1000].map((chip) => `<button class="chip chip-${chip} ${ui.selectedChip === chip ? "selected" : ""}" data-chip="${chip}">${chip}</button>`).join("")}
        </div>
        <button class="secondary" data-press-last-win>Press Last Win</button>
        <button class="secondary clear-button" data-clear-bets>Clear Removable Bets</button>
        <button class="secondary ambience-button ${ui.music ? "active" : ""}" data-table-music>${ui.music ? "Ambience On" : "Start Ambience"}</button>
        <div class="quick-bets">
          <button data-special-bet="dontPassOdds" ${game.table.crapless ? "disabled" : ""}>Don't Odds</button>
          <button data-special-bet="dontCome" ${game.table.crapless ? "disabled" : ""}>Don't Come</button>
        </div>
      </aside>
    `]
  ];
  return `
    <section class="game-dock-shell craps-dock-shell">
      ${dockZone("top", groups)}
      <div class="dock-middle">
        ${dockZone("left", groups)}
        <div class="game-center felt-wrap">
        <div class="table-glow"></div>
        <div class="craps-felt">
          <div class="puck ${game.point ? "on" : ""}">${game.puck}</div>
          <div class="layout-row points ${game.table.crapless ? "crapless-points" : ""}">
            ${getPointNumbers(game).map((number) => betZone("place", number, number, `Place / Buy / Lay ${number}`)).join("")}
          </div>
          ${palaceTableLayout(game)}
          <div class="center-rail">
            <strong>Shooter: ${game.shooters[game.shooterIndex]}</strong>
            <span>${game.table.crapless ? "Crapless Craps" : "Classic Craps"} • Point ${game.point ?? "off"} • ${money(game.table.min)} min • ${game.table.oddsMultiple}x odds</span>
          </div>
        </div>
        </div>
        ${dockZone("right", groups)}
      </div>
      ${dockZone("bottom", groups)}
    </section>
    <section class="history-band">
      <div class="roll-history">${game.rollHistory.slice(0, 18).map((roll) => `<span class="${roll.total === 7 ? "seven" : ""}">${roll.total}</span>`).join("")}</div>
      <div class="ledger">${game.ledger.slice(0, 5).map((item) => `<span class="${item.amount >= 0 ? "good" : "bad"}">${item.label}</span>`).join("")}</div>
    </section>
  `;
}

function betSlip(playerBetTotal, shooter) {
  const { game, ui } = snapshot;
  const lastNet = playerEventNet(ui.lastEvent);
  return `
    <div class="bet-slip">
      <div><span>Shooter</span><strong>${shooter.name}</strong></div>
      <div><span>Turn</span><strong>${shooter.human ? "Manual" : `${ui.turnSeconds ?? 0}s`}</strong></div>
      <div><span>Your bets</span><strong>${money(playerBetTotal)}</strong></div>
      <div><span>Last roll</span><strong class="${lastNet >= 0 ? "good" : "bad"}">${money(lastNet)}</strong></div>
    </div>
  `;
}

function dockZone(side, groups) {
  const content = groups
    .filter(([, dock]) => dock === side)
    .map(([, , markup]) => markup)
    .join("");
  return `<div class="dock-zone dock-${side} ${content ? "" : "empty"}">${content}</div>`;
}

function videoPokerGame() {
  const poker = snapshot.videoPoker;
  const totalWager = poker.wager * poker.hands;
  return `
    <section class="card-game-screen video-poker-screen">
      <div class="card-game-hero">
        <div>
          <p class="eyebrow">Video Poker</p>
          <h2>Jacks or Better</h2>
          <p>Hold your best cards, draw once, and chase the Palace paytable.</p>
        </div>
      </div>
      <div class="card-game-layout info-dock-${snapshot.ui.infoDock}">
        <section class="machine-panel video-machine controls-dock-${snapshot.ui.controlsDock}">
          <div class="machine-display">
            <strong>${poker.result}</strong>
            <span>${poker.hands} hand${poker.hands === 1 ? "" : "s"} • Bet ${credits(poker.wager)} each / ${credits(totalWager)} total • Last payout ${credits(poker.lastPayout)}</span>
          </div>
          <div class="poker-hand">
            ${renderPokerCards(poker)}
          </div>
          ${renderPokerResults(poker)}
          <div class="machine-controls">
            ${creditRack()}
            <label class="hands-control">Hands
              <select data-video-poker-hands ${poker.status === "dealt" ? "disabled" : ""}>
                ${options(Object.fromEntries(Array.from({ length: 10 }, (_, index) => [index + 1, `${index + 1}`])), poker.hands)}
              </select>
            </label>
            <button class="primary draw-button" data-video-poker-action="${poker.status === "dealt" ? "draw" : "deal"}">${poker.status === "dealt" ? "Draw" : "Deal"}</button>
            <button class="secondary" data-new-video-poker>New Session</button>
          </div>
        </section>
        <aside class="guide-panel">
          <h3>Jacks or Better Paytable</h3>
          <div class="paytable">
            ${JACKS_OR_BETTER_PAYTABLE.map(([name, multiplier]) => `<span>${name}</span><strong>${multiplier} to 1</strong>`).join("")}
          </div>
          <div class="mini-panel">
            <strong>Quick Guide</strong>
            <span>Keep any paying pair or better.</span>
            <span>Four to a royal usually beats a low pair.</span>
            <span>Three to a royal beats most unsuited high-card holds.</span>
            <span>Never chase inside straights over made high pairs.</span>
          </div>
          <div class="mini-panel">
            <strong>Session</strong>
            <span>Hands played: ${poker.handsPlayed}</span>
            <span>Best hand: ${poker.bestHand?.name ?? "None yet"}</span>
            <span>Current hands: ${poker.hands}</span>
            <span>Expected return: about 99.54% with full-pay optimal play</span>
          </div>
        </aside>
      </div>
    </section>
  `;
}

function ultimateXGame() {
  const poker = snapshot.ultimateX;
  const totalWager = poker.wager * poker.hands;
  return `
    <section class="card-game-screen video-poker-screen ultimate-x-screen">
      <div class="card-game-hero ultimate-hero">
        <div>
          <p class="eyebrow">Video Poker</p>
          <h2>Deuces Wild</h2>
          <p>Deuces are wild. Chase royal hands, five of a kind, and four deuces.</p>
        </div>
      </div>
      <div class="card-game-layout info-dock-${snapshot.ui.infoDock}">
        <section class="machine-panel video-machine ultimate-machine controls-dock-${snapshot.ui.controlsDock}">
          <div class="machine-display">
            <strong>${poker.result}</strong>
            <span>${poker.hands} hand${poker.hands === 1 ? "" : "s"} • Bet ${credits(poker.wager)} each / ${credits(totalWager)} total • Last payout ${credits(poker.lastPayout)}</span>
          </div>
          <div class="poker-hand animated-hand">
            ${renderUltimateXCards(poker)}
          </div>
          ${renderPokerResults(poker)}
          <div class="machine-controls">
            ${creditRack()}
            <label class="hands-control">Hands
              <select data-ultimate-x-hands ${poker.status === "dealt" ? "disabled" : ""}>
                ${options(Object.fromEntries(Array.from({ length: 10 }, (_, index) => [index + 1, `${index + 1}`])), poker.hands)}
              </select>
            </label>
            <button class="primary draw-button" data-deuces-wild-action="${poker.status === "dealt" ? "draw" : "deal"}">${poker.status === "dealt" ? "Draw" : "Deal"}</button>
            <button class="secondary" data-new-ultimate-x>New Session</button>
          </div>
        </section>
        <aside class="guide-panel ultimate-guide">
          <h3>Deuces Wild Paytable</h3>
          <div class="paytable">
            ${DEUCES_WILD_ULTIMATE_X_PAYTABLE.map(([name, multiplier]) => `<span>${name}</span><strong>${multiplier} to 1</strong>`).join("")}
          </div>
          <div class="mini-panel">
            <strong>Deuces Guide</strong>
            <span>Never discard a deuce.</span>
            <span>Four deuces is the signature jackpot hand.</span>
            <span>Wild royal and five of a kind are premium chase spots.</span>
            <span>Variance is higher than Jacks or Better.</span>
          </div>
          <div class="mini-panel">
            <strong>Session</strong>
            <span>Hands played: ${poker.handsPlayed}</span>
            <span>Best hand: ${poker.bestHand?.name ?? "None yet"}</span>
            <span>Current hands: ${poker.hands}</span>
            <span>Minimum paying hand: Three of a Kind</span>
          </div>
        </aside>
      </div>
    </section>
  `;
}

function bonusPokerGame() {
  const poker = snapshot.bonusPoker;
  const totalWager = poker.wager * poker.hands;
  return `
    <section class="card-game-screen video-poker-screen bonus-poker-screen">
      <div class="card-game-hero bonus-hero">
        <div>
          <p class="eyebrow">Video Poker</p>
          <h2>Bonus Poker</h2>
          <p>Jacks-or-better draw poker with premium payouts for four aces and low quads.</p>
        </div>
      </div>
      <div class="card-game-layout info-dock-${snapshot.ui.infoDock}">
        <section class="machine-panel video-machine bonus-machine controls-dock-${snapshot.ui.controlsDock}">
          <div class="machine-display">
            <strong>${poker.result}</strong>
            <span>${poker.hands} hand${poker.hands === 1 ? "" : "s"} • Bet ${credits(poker.wager)} each / ${credits(totalWager)} total • Last payout ${credits(poker.lastPayout)}</span>
          </div>
          <div class="poker-hand">
            ${renderBonusPokerCards(poker)}
          </div>
          ${renderPokerResults(poker)}
          <div class="machine-controls">
            ${creditRack()}
            <label class="hands-control">Hands
              <select data-bonus-poker-hands ${poker.status === "dealt" ? "disabled" : ""}>
                ${options(Object.fromEntries(Array.from({ length: 10 }, (_, index) => [index + 1, `${index + 1}`])), poker.hands)}
              </select>
            </label>
            <button class="primary draw-button" data-bonus-poker-action="${poker.status === "dealt" ? "draw" : "deal"}">${poker.status === "dealt" ? "Draw" : "Deal"}</button>
            <button class="secondary" data-new-bonus-poker>New Session</button>
          </div>
        </section>
        <aside class="guide-panel bonus-guide">
          <h3>Bonus Poker Paytable</h3>
          <div class="paytable">
            ${BONUS_POKER_PAYTABLE.map(([name, multiplier]) => `<span>${name}</span><strong>${multiplier} to 1</strong>`).join("")}
          </div>
          <div class="mini-panel">
            <strong>Quick Guide</strong>
            <span>Four aces are the signature bonus hand.</span>
            <span>Four 2s, 3s, or 4s outrank standard quads.</span>
            <span>Keep high pairs, premium draws, and made hands.</span>
            <span>Variance sits above Jacks or Better.</span>
          </div>
          <div class="mini-panel">
            <strong>Session</strong>
            <span>Hands played: ${poker.handsPlayed}</span>
            <span>Best hand: ${poker.bestHand?.name ?? "None yet"}</span>
            <span>Current hands: ${poker.hands}</span>
            <span>Premium target: Four Aces</span>
          </div>
        </aside>
      </div>
    </section>
  `;
}

function blackjackGame() {
  const blackjack = snapshot.blackjack;
  const currentHand = blackjack.splitHands?.[blackjack.activeHandIndex ?? 0]?.cards ?? blackjack.player;
  const playerValue = handValue(currentHand);
  const dealerUp = blackjack.dealer[0];
  const dealerValue = blackjack.status === "player" && blackjack.dealer.length ? handValue([dealerUp]) : handValue(blackjack.dealer);
  const activeSplit = blackjack.splitHands?.[blackjack.activeHandIndex ?? 0];
  const currentWager = activeSplit?.wager ?? blackjack.wager;
  const canDouble = blackjack.status === "player" && currentHand.length === 2 && blackjack.bankroll >= currentWager;
  const canSplit = blackjack.status === "player" && !blackjack.splitHands && blackjack.player.length === 2 && blackjack.player[0].rank === blackjack.player[1].rank && blackjack.bankroll >= blackjack.wager;
  return `
    <section class="card-game-screen blackjack-screen">
      <div class="card-game-hero">
        <div>
          <p class="eyebrow">Table Game</p>
          <h2>Blackjack</h2>
          <p>3:2 blackjack, dealer stands on soft 17, with a live player guide.</p>
        </div>
      </div>
      <div class="card-game-layout blackjack-layout info-dock-${snapshot.ui.infoDock}">
        <section class="blackjack-table controls-dock-${snapshot.ui.controlsDock}">
          <div class="dealer-hand">
            <div class="hand-label"><span>Dealer</span><strong>${blackjack.dealer.length ? dealerValue.total : "-"}</strong></div>
            <div class="card-row">${renderBlackjackCards(blackjack.dealer, blackjack.status === "player")}</div>
          </div>
          <div class="blackjack-felt-mark">
            <strong>BLACKJACK PAYS 3 TO 2</strong>
            <span>Dealer stands on soft 17</span>
          </div>
          <div class="player-hand">
            ${renderBlackjackPlayerHands(blackjack, playerValue)}
          </div>
          <div class="machine-display blackjack-callout">
            <strong>${blackjack.message}</strong>
            <span>Wager ${money(currentWager)} • ${blackjack.handsPlayed} hands</span>
          </div>
          <div class="machine-controls blackjack-controls">
            <div class="chip-rack compact-rack">
              ${[5, 10, 25, 100, 500].map((chip) => `<button class="chip chip-${chip} ${snapshot.ui.selectedChip === chip ? "selected" : ""}" data-chip="${chip}">${chip}</button>`).join("")}
            </div>
            <button class="primary" data-blackjack-deal ${blackjack.status === "player" ? "disabled" : ""}>Deal</button>
            <button class="secondary" data-blackjack-action="hit" ${blackjack.status === "player" ? "" : "disabled"}>Hit</button>
            <button class="secondary" data-blackjack-action="stand" ${blackjack.status === "player" ? "" : "disabled"}>Stand</button>
            <button class="secondary" data-blackjack-action="double" ${canDouble ? "" : "disabled"}>Double</button>
            <button class="secondary" data-blackjack-action="split" ${canSplit ? "" : "disabled"}>Split</button>
            <button class="secondary" data-new-blackjack>New Session</button>
          </div>
        </section>
        <aside class="guide-panel">
          <h3>Player Guide</h3>
          <div class="strategy-card">
            <span>Recommended Play</span>
            <strong>${blackjackGuide(currentHand, dealerUp, canDouble)}</strong>
          </div>
          <div class="paytable blackjack-odds">
            ${blackjackOddsSummary().map(([name, value]) => `<span>${name}</span><strong>${value}</strong>`).join("")}
          </div>
          <div class="mini-panel">
            <strong>Basic Strategy Notes</strong>
            <span>Stand more often when dealer shows 2 through 6.</span>
            <span>Hit stiff hands against 7 through Ace.</span>
            <span>Double 10 or 11 when the dealer card is vulnerable.</span>
            <span>Split matching pairs when the table position calls for it.</span>
          </div>
          <div class="mini-panel">
            <strong>Session</strong>
            <span>Wins: ${blackjack.wins}</span>
            <span>Losses: ${blackjack.losses}</span>
            <span>Pushes: ${blackjack.pushes}</span>
          </div>
        </aside>
      </div>
    </section>
  `;
}

function barPage() {
  const inventory = snapshot.account?.inventory ?? [];
  const groups = BAR_ITEMS.reduce((acc, item) => {
    acc[item.category] = [...(acc[item.category] ?? []), item];
    return acc;
  }, {});
  return `
    <section class="bar-page">
      <div class="bar-room">
        <div class="bottle-wall">
          ${Array.from({ length: 30 }, (_, index) => `<span style="--bottle:${index % 5}"></span>`).join("")}
        </div>
        <div class="bar-counter">
          <div class="counter-shine"></div>
          <div class="bar-video-poker">
            <strong>VIDEO POKER</strong>
            <span>OUT OF ORDER</span>
          </div>
          <div class="bar-menu-board">
            <p class="eyebrow">Neon Palace bar</p>
            <h2>Bar Menu</h2>
            <div class="bar-menu-grid">
              ${Object.entries(groups).map(([category, items]) => `
                <section class="bar-menu-section">
                  <h3>${category}</h3>
                  ${items.map((item) => `
                    <article class="bar-item">
                      <div>
                        <strong>${item.name}</strong>
                        <p>${item.description}</p>
                      </div>
                      <button data-bar-item="${item.id}">${credits(item.cost)}</button>
                    </article>
                  `).join("")}
                </section>
              `).join("")}
            </div>
          </div>
          <aside class="bar-inventory">
            <h3>Inventory</h3>
            ${inventory.length ? inventory.slice().reverse().map((item) => `<span>${item.name}</span>`).join("") : "<p>No bar items yet.</p>"}
          </aside>
        </div>
      </div>
    </section>
  `;
}

function renderBlackjackPlayerHands(blackjack, fallbackValue) {
  if (!blackjack.splitHands?.length) {
    return `
      <div class="hand-label"><span>Your Hand</span><strong>${blackjack.player.length ? fallbackValue.total : "-"}</strong></div>
      <div class="card-row">${renderBlackjackCards(blackjack.player)}</div>
    `;
  }
  return `
    <div class="split-hand-grid">
      ${blackjack.splitHands.map((hand, index) => {
        const value = handValue(hand.cards);
        const active = blackjack.status === "player" && index === blackjack.activeHandIndex;
        return `
          <article class="split-hand ${active ? "active" : ""} ${hand.outcome ?? ""}">
            <div class="hand-label"><span>Hand ${index + 1}${active ? " • Active" : ""}</span><strong>${value.total}</strong></div>
            <div class="card-row">${renderBlackjackCards(hand.cards)}</div>
            <em>${money(hand.wager)}${hand.outcome ? ` • ${hand.outcome}` : ""}</em>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderPokerCards(poker) {
  if (!poker.hand.length) return Array.from({ length: 5 }, () => `<div class="playing-card card-back"><span>NP</span></div>`).join("");
  return poker.hand.map((card, index) => `
    <button class="playing-card animated-card ${card.suit} ${poker.held[index] ? "held" : ""}" style="--card-i:${index}" data-poker-hold="${index}" ${poker.status === "dealt" ? "" : "disabled"}>
      <span>${card.rank}</span>
      <b>${suitSymbol(card.suit)}</b>
      <em>${poker.held[index] ? "HELD" : "HOLD"}</em>
    </button>
  `).join("");
}

function renderUltimateXCards(poker) {
  if (!poker.hand.length) return Array.from({ length: 5 }, (_, index) => `<div class="playing-card card-back animated-card" style="--card-i:${index}"><span>DW</span></div>`).join("");
  return poker.hand.map((card, index) => `
    <button class="playing-card animated-card ultimate-card ${card.suit} ${card.rank === "2" ? "wild-deuce" : ""} ${poker.held[index] ? "held" : ""}" style="--card-i:${index}" data-ultimate-x-hold="${index}" ${poker.status === "dealt" ? "" : "disabled"}>
      <span>${card.rank}</span>
      <b>${suitSymbol(card.suit)}</b>
      <em>${card.rank === "2" ? "WILD" : poker.held[index] ? "HELD" : "HOLD"}</em>
    </button>
  `).join("");
}

function renderBonusPokerCards(poker) {
  if (!poker.hand.length) return Array.from({ length: 5 }, (_, index) => `<div class="playing-card card-back animated-card" style="--card-i:${index}"><span>BP</span></div>`).join("");
  return poker.hand.map((card, index) => `
    <button class="playing-card animated-card bonus-card ${card.suit} ${poker.held[index] ? "held" : ""}" style="--card-i:${index}" data-bonus-poker-hold="${index}" ${poker.status === "dealt" ? "" : "disabled"}>
      <span>${card.rank}</span>
      <b>${suitSymbol(card.suit)}</b>
      <em>${poker.held[index] ? "HELD" : "HOLD"}</em>
    </button>
  `).join("");
}

function renderPokerResults(poker, showMultipliers = false) {
  const extraHands = poker.finalHands?.slice(1) ?? [];
  if (!extraHands.length) return "";
  return `
    <div class="multi-hand-results">
      ${extraHands.map((hand, index) => {
        const handIndex = index + 1;
        const result = poker.results?.[handIndex] ?? { name: "No Win", multiplier: 0 };
        const multiplier = showMultipliers ? poker.activeMultipliers?.[handIndex] ?? 1 : 1;
        const payout = poker.wager * result.multiplier * multiplier;
        return `
          <article class="multi-hand-row ${result.multiplier > 0 ? "winner" : ""}">
            <div class="mini-card-row">${hand.map((card) => `<span class="mini-card ${card.suit} ${card.rank === "2" && showMultipliers ? "wild" : ""}">${card.rank}${suitSymbol(card.suit)}</span>`).join("")}</div>
            <strong>${handIndex + 1}. ${result.name}</strong>
            <em>${showMultipliers ? `${multiplier}x • ` : ""}${credits(payout)}</em>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderBlackjackCards(cards, hideHole = false) {
  if (!cards.length) return `<div class="playing-card card-back"><span>NP</span></div><div class="playing-card card-back"><span>NP</span></div>`;
  return cards.map((card, index) => hideHole && index === 1
    ? `<div class="playing-card card-back animated-card" style="--card-i:${index}"><span>NP</span></div>`
    : `<div class="playing-card animated-card ${card.suit}" style="--card-i:${index}"><span>${card.rank}</span><b>${suitSymbol(card.suit)}</b></div>`).join("");
}

function creditRack() {
  const credits = [0.05, 0.1, 0.25, 0.5, 1, 5];
  return `
    <div class="credit-rack">
      ${credits.map((credit) => `<button class="credit-button ${snapshot.ui.selectedCredit === credit ? "selected" : ""}" data-credit="${credit}">${creditLabel(credit)}</button>`).join("")}
    </div>
  `;
}

function suitSymbol(suit) {
  return { spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣" }[suit] ?? "";
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

function leaderboard() {
  const players = snapshot.game.players ?? [];
  if (!players.length) return "";
  const sorted = [...players].sort((a, b) => b.bankroll - a.bankroll);
  return `
    <div class="leaderboard mini-panel">
      <strong>Table Leaderboard</strong>
      ${sorted.map((player, index) => `
        <div class="${player.human ? "you" : ""} owner-row owner-${player.id}">
          <span>${index + 1}. ${player.name}</span>
          <b>${money(player.bankroll)}</b>
        </div>
      `).join("")}
    </div>
  `;
}

function palaceTableLayout(game) {
  return `
    <div class="palace-layout">
      ${playerWing("left", game)}
      ${centerIsland()}
      ${playerWing("right", game)}
    </div>
  `;
}

function playerWing(side, game) {
  const showStacks = side === "left";
  const dontCome = game.table.crapless
    ? `<div class="bet-zone disabled palace-disabled"><span>NO DON'T COME</span></div>`
    : betZone("dontCome", "", "DON'T COME BAR", "Don't Come", { showStacks });
  const dontPass = game.table.crapless
    ? `<div class="bet-zone disabled palace-disabled"><span>NO DON'T PASS</span></div>`
    : betZone("dontPass", "", "DON'T PASS BAR", "Don't Pass", { showStacks });
  return `
    <div class="player-wing ${side}-wing">
      <div class="wing-top">
        ${dontCome}
        ${betZone("come", "", "COME", "Come", { showStacks })}
      </div>
      ${fieldZone(side, showStacks)}
      ${dontPass}
      ${betZone("passLine", "", "PASS LINE", "Pass Line", { showStacks })}
    </div>
  `;
}

function centerIsland() {
  return `
    <div class="center-island">
      <div class="island-banner"><span>4 TO 1</span><strong>ANY SEVEN</strong><span>4 TO 1</span></div>
      <div class="island-grid">
        ${["hard4", "hard6", "hard8", "hard10"].map((key) => betZone("hardways", key, key.replace("hard", "HARD "), "Hardway")).join("")}
        ${["aces", "yo", "boxcars", "any7"].map((key) => betZone("proposition", key, propLabel(key), "Proposition")).join("")}
      </div>
      <div class="horn-row">
        ${betZone("proposition", "centerAction", "CENTER ACTION", "Center Action")}
        ${betZone("proposition", "anyCraps", "ANY CRAPS", "Any Craps")}
      </div>
      <div class="big-row">
        ${betZone("big", 6, "BIG 6", "Big 6")}
        ${betZone("big", 8, "BIG 8", "Big 8")}
      </div>
    </div>
  `;
}

function betZone(type, number, label, title, options = {}) {
  const showStacks = options.showStacks !== false;
  const isNumberBox = type === "place" && number !== "";
  const bets = betsForZone(type, number, isNumberBox);
  const buyBets = isNumberBox ? bets.filter((bet) => bet.type === "buy" && bet.owner === "player") : [];
  const layoutBets = isNumberBox ? bets.filter((bet) => !(bet.type === "buy" && bet.owner === "player")) : bets;
  const passOdds = type === "passLine" ? snapshot.game.bets.filter((bet) => bet.owner === "player" && bet.type === "odds" && bet.parentType === "passLine") : [];
  const isPoint = isNumberBox && snapshot.game.point === number;
  const codes = [...new Set(layoutBets.map(chipCode).filter(Boolean))].join(" ");
  return `
    <div class="bet-zone ${type} ${isPoint ? "point-active" : ""}" data-bet-type="${type}" data-bet-number="${number ?? ""}" title="${title}" role="button" tabindex="0">
      ${isPoint ? `<em class="point-marker">ON</em>` : ""}
      <span>${label}</span>
      ${type === "passLine" ? `<div class="pass-odds-area"><button class="odds-lane pass-odds-lane" data-special-bet="passOdds" ${snapshot.game.point ? "" : "disabled"}>ODDS ${money(passOdds.reduce((sum, bet) => sum + bet.amount, 0))}</button>${renderBetStack(passOdds, "", "odds-stack")}</div>` : ""}
      ${isNumberBox ? `<button class="buy-lane" data-number-action="buy" data-number="${number}">BUY ${buyBets.reduce((sum, bet) => sum + bet.amount, 0) ? money(buyBets.reduce((sum, bet) => sum + bet.amount, 0)) : ""}</button><div class="number-controls"><button data-number-action="pull" data-number="${number}">Pull</button><button data-number-action="lay" data-number="${number}">Lay</button></div>` : ""}
      ${showStacks ? renderBetStack(layoutBets, codes) : ""}
      ${isNumberBox && showStacks ? renderBetStack(buyBets, "", "buy-stack") : ""}
    </div>
  `;
}

function betsForZone(type, number, isNumberBox) {
  if (isNumberBox) {
    return snapshot.game.bets.filter((bet) => {
      if (!["place", "buy", "lay", "come", "dontCome", "odds"].includes(bet.type)) return false;
      if (`${bet.number ?? ""}` !== `${number}`) return false;
      return !(bet.type === "odds" && ["passLine", "dontPass"].includes(bet.parentType));
    });
  }
  if (type === "passLine") {
    return snapshot.game.bets.filter((bet) => bet.type === "passLine");
  }
  return snapshot.game.bets.filter((bet) => bet.type === type && `${bet.number ?? ""}` === `${number ?? ""}`);
}

function fieldZone(side = "", showStacks = true) {
  const bets = snapshot.game.bets.filter((bet) => bet.type === "field");
  return `
    <div class="bet-zone field field-real field-${side}" data-bet-type="field" data-bet-number="" title="Field" role="button" tabindex="0">
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
      ${showStacks ? renderBetStack(bets) : ""}
    </div>
  `;
}

function chipCode(bet) {
  return { come: "C", dontCome: "DC", odds: "O", buy: "B", lay: "L", place: "P", big: "BIG" }[bet.type] ?? "";
}

function renderBetStack(bets, codes = "", extraClass = "") {
  const stacks = aggregateBetsByOwner(bets);
  if (!stacks.length) return `<div class="stack ${extraClass} empty"></div>`;
  return `
    <div class="stack ${extraClass}">
      ${stacks.map((stack) => `<i class="bet-chip owner-${stack.owner} corner-${stack.owner}">${money(stack.amount)}</i>`).join("")}
      ${codes ? `<b>${codes}</b>` : ""}
    </div>
  `;
}

function aggregateBetsByOwner(bets) {
  const totals = new Map();
  bets.forEach((bet) => totals.set(bet.owner, (totals.get(bet.owner) ?? 0) + bet.amount));
  return [...totals.entries()].map(([owner, amount]) => ({ owner, amount }));
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
        <label><span>HUD dock</span><select data-ui="hudDock">${options({ top: "Top", right: "Right", bottom: "Bottom", left: "Left" }, ui.hudDock)}</select></label>
        <label><span>Controls dock</span><select data-ui="controlsDock">${options({ top: "Top", right: "Right", bottom: "Bottom", left: "Left" }, ui.controlsDock)}</select></label>
        <label><span>Info / guide dock</span><select data-ui="infoDock">${options({ top: "Top", right: "Right", bottom: "Bottom", left: "Left" }, ui.infoDock)}</select></label>
        <label><span>UI scale</span><input type="range" min="0.72" max="1" step="0.04" value="${ui.uiScale ?? 0.72}" data-ui="uiScale"></label>
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
    ["Credit pressure", "Realistic pacing matters. Betting too many one-roll props can drain a session quickly even when the table feels hot."]
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

function options(map, selected) {
  return Object.entries(map).map(([value, label]) => `<option value="${value}" ${String(value) === String(selected) ? "selected" : ""}>${label}</option>`).join("");
}

function modeText(key) {
  return {
    practice: "Low pressure rails, gentle limits, and a forgiving credit curve.",
    casino: "Authentic Strip-style pacing with balanced limits and AI tablemates.",
    crapless: "No come-out craps: 2, 3, 11, and 12 become points with richer true odds.",
    highRoller: "Higher limits, faster swings, and richer odds multiples.",
    tutorial: "Guided explanations for first-time shooters.",
    quick: "Fast action tuned for short sessions."
  }[key];
}

function propLabel(key) {
  return { any7: "ANY 7", anyCraps: "ANY CRAPS", yo: "YO 11", aces: "ACES", boxcars: "BOXCARS" }[key] ?? key;
}

function activeBankroll() {
  if (snapshot.ui.page === "videoPoker") return snapshot.videoPoker.bankroll;
  if (snapshot.ui.page === "ultimateX") return snapshot.ultimateX.bankroll;
  if (snapshot.ui.page === "bonusPoker") return snapshot.bonusPoker.bankroll;
  if (snapshot.ui.page === "blackjack") return snapshot.blackjack.bankroll;
  if (snapshot.ui.page === "table") return snapshot.game.bankroll;
  return snapshot.account?.credits ?? snapshot.game.bankroll;
}

function activeBankrollLabel() {
  return ["videoPoker", "ultimateX", "bonusPoker", "bar", "home", "account", "settings", "stats"].includes(snapshot.ui.page) ? credits(activeBankroll()) : money(activeBankroll());
}

function money(value) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)} cr`;
}

function credits(value) {
  return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} cr`;
}

function creditLabel(value) {
  return value < 1 ? `${Math.round(value * 100)}¢` : credits(value);
}
