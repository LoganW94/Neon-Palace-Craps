export const POINT_NUMBERS = [4, 5, 6, 8, 9, 10];
export const CRAPLESS_POINT_NUMBERS = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12];
export const HARDWAYS = {
  hard4: { total: 4, faces: [2, 2], pays: 7 },
  hard6: { total: 6, faces: [3, 3], pays: 9 },
  hard8: { total: 8, faces: [4, 4], pays: 9 },
  hard10: { total: 10, faces: [5, 5], pays: 7 }
};

export const BET_CATALOG = {
  passLine: { label: "Pass Line", min: 10, max: 5000, houseEdge: 1.41 },
  dontPass: { label: "Don't Pass", min: 10, max: 5000, houseEdge: 1.36 },
  come: { label: "Come", min: 10, max: 5000, houseEdge: 1.41 },
  dontCome: { label: "Don't Come", min: 10, max: 5000, houseEdge: 1.36 },
  odds: { label: "Odds", min: 10, max: 10000, houseEdge: 0 },
  field: { label: "Field", min: 10, max: 3000, houseEdge: 5.56 },
  place: { label: "Place", min: 10, max: 5000, houseEdge: 1.52 },
  buy: { label: "Buy", min: 20, max: 5000, houseEdge: 4.76 },
  lay: { label: "Lay", min: 20, max: 5000, houseEdge: 2.44 },
  hardways: { label: "Hardways", min: 5, max: 1000, houseEdge: 9.09 },
  proposition: { label: "Proposition", min: 5, max: 1000, houseEdge: 11.11 },
  big: { label: "Big 6 / Big 8", min: 10, max: 5000, houseEdge: 9.09 }
};

export const MODES = {
  practice: { label: "Practice", min: 5, max: 1000, bankroll: 1000, volatility: 0.8 },
  casino: { label: "Casino Simulation", min: 10, max: 5000, bankroll: 2000, volatility: 1 },
  crapless: { label: "Crapless Craps", min: 10, max: 5000, bankroll: 2000, volatility: 1.2, crapless: true },
  highRoller: { label: "High Roller", min: 100, max: 50000, bankroll: 25000, volatility: 1.35 },
  tutorial: { label: "Beginner Tutorial", min: 5, max: 500, bankroll: 750, volatility: 0.65 },
  quick: { label: "Quick Play", min: 10, max: 2500, bankroll: 1500, volatility: 1 }
};

const PLACE_PAYOUTS = {
  2: [11, 2],
  3: [11, 4],
  4: [9, 5],
  5: [7, 5],
  6: [7, 6],
  8: [7, 6],
  9: [7, 5],
  10: [9, 5],
  11: [11, 4],
  12: [11, 2]
};

const TRUE_ODDS = {
  2: [6, 1],
  3: [3, 1],
  4: [2, 1],
  5: [3, 2],
  6: [6, 5],
  8: [6, 5],
  9: [3, 2],
  10: [2, 1],
  11: [3, 1],
  12: [6, 1]
};

const LAY_ODDS = {
  2: [1, 6],
  3: [1, 3],
  4: [1, 2],
  5: [2, 3],
  6: [5, 6],
  8: [5, 6],
  9: [2, 3],
  10: [1, 2],
  11: [1, 3],
  12: [1, 6]
};

export function createInitialState(mode = "casino", startingBankroll) {
  const modeConfig = MODES[mode] ?? MODES.casino;
  const playerBankroll = startingBankroll ?? modeConfig.bankroll;
  const tablePlayers = createTablePlayers(playerBankroll, modeConfig.min);
  return {
    mode,
    table: {
      min: modeConfig.min,
      max: modeConfig.max,
      oddsMultiple: mode === "highRoller" ? 10 : 3,
      crapless: Boolean(modeConfig.crapless),
      pointNumbers: Boolean(modeConfig.crapless) ? CRAPLESS_POINT_NUMBERS : POINT_NUMBERS
    },
    bankroll: playerBankroll,
    buyIn: playerBankroll,
    point: null,
    shooterIndex: 0,
    shooters: tablePlayers.map((player) => player.name),
    players: tablePlayers,
    puck: "OFF",
    bets: [],
    rollHistory: [],
    session: {
      rolls: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      sevenOuts: 0,
      pointsMade: 0,
      biggestWin: 0,
      biggestLoss: 0,
      streak: 0,
      hotRoll: 0,
      coldRoll: 0,
      totalWagered: 0,
      totalWon: 0,
      totalLost: 0
    },
    dealer: {
      personality: "classic",
      lastCall: "Place your bets. Dice are in the middle."
    },
    aiPlayers: tablePlayers.filter((player) => !player.human),
    ledger: []
  };
}

export function createTablePlayers(playerBankroll, tableMin = 10) {
  return [
    { id: "player", name: "You", human: true, style: "Manual", bankroll: playerBankroll, buyIn: playerBankroll, mood: "at the rail", fieldUnit: tableMin },
    { id: "ai-ava", name: "Ava", human: false, style: "Field nibbler", bankroll: 1800, buyIn: 1800, mood: "focused", fieldUnit: tableMin },
    { id: "ai-marco", name: "Marco", human: false, style: "Field press", bankroll: 2200, buyIn: 2200, mood: "chatty", fieldUnit: tableMin * 2 },
    { id: "ai-jules", name: "Jules", human: false, style: "Field steady", bankroll: 1600, buyIn: 1600, mood: "calm", fieldUnit: tableMin }
  ];
}

export function createAiPlayers() {
  return createTablePlayers(2000).filter((player) => !player.human);
}

export function rollDice(rng = Math.random) {
  const die1 = 1 + Math.floor(rng() * 6);
  const die2 = 1 + Math.floor(rng() * 6);
  return { die1, die2, total: die1 + die2, hard: die1 === die2 };
}

export function placeBet(state, bet) {
  const catalog = BET_CATALOG[bet.type] ?? BET_CATALOG.proposition;
  const amount = clampToTable(Number(bet.amount), state.table.min, catalog.max);
  const owner = bet.owner ?? "player";
  const ownerBankroll = getOwnerBankroll(state, owner);
  if (bet.type === "odds") {
    const oddsCheck = validateOddsBet(state, bet);
    if (!oddsCheck.ok) return { state, event: { type: "rejected", message: oddsCheck.message } };
  }
  if (state.table.crapless && ["dontPass", "dontCome"].includes(bet.type)) {
    return { state, event: { type: "rejected", message: "Don't bets are not offered on this Crapless Craps table." } };
  }
  if (ownerBankroll < amount) {
    return { state, event: { type: "rejected", message: `${playerName(state, owner)} is short on chips for that bet.` } };
  }
  if (amount < catalog.min) {
    return { state, event: { type: "rejected", message: `${catalog.label} minimum is $${catalog.min}.` } };
  }

  const next = clone(state);
  adjustOwnerBankroll(next, owner, -amount);
  next.session.totalWagered += amount;
  next.bets.push({
    id: bet.id ?? cryptoId(),
    owner,
    type: bet.type,
    amount,
    number: bet.number ?? null,
    parentType: bet.parentType ?? null,
    travelsTo: null,
    contract: ["passLine", "dontPass", "come", "dontCome"].includes(bet.type)
  });
  next.dealer.lastCall = chipCall(amount, catalog.label, bet.number);
  next.ledger.unshift({ kind: "bet", amount: -amount, label: next.dealer.lastCall, at: Date.now() });
  return { state: next, event: { type: "betPlaced", message: next.dealer.lastCall } };
}

export function clearWorkingBets(state) {
  const next = clone(state);
  const removable = next.bets.filter((bet) => !bet.contract && bet.owner === "player");
  removable.forEach((bet) => adjustOwnerBankroll(next, bet.owner, bet.amount));
  next.bets = next.bets.filter((bet) => bet.contract || bet.owner !== "player");
  next.dealer.lastCall = "Non-contract bets are off the layout.";
  next.ledger.unshift({ kind: "clear", amount: removable.reduce((sum, bet) => sum + bet.amount, 0), label: next.dealer.lastCall, at: Date.now() });
  return next;
}

export function pullNumberBets(state, number) {
  const next = clone(state);
  const pullableTypes = ["place", "buy", "lay", "big", "odds"];
  const pulled = next.bets.filter((bet) => pullableTypes.includes(bet.type) && Number(bet.number) === Number(number));
  if (!pulled.length) {
    next.dealer.lastCall = `No removable chips on ${number}.`;
    return { state: next, event: { type: "noAction", message: next.dealer.lastCall } };
  }
  const returned = pulled.reduce((sum, bet) => sum + bet.amount, 0);
  const pulledIds = new Set(pulled.map((bet) => bet.id));
  next.bets = next.bets.filter((bet) => !pulledIds.has(bet.id));
  pulled.forEach((bet) => adjustOwnerBankroll(next, bet.owner, bet.amount));
  next.dealer.lastCall = `Pulled down $${returned} from ${number}.`;
  next.ledger.unshift({ kind: "pull", amount: returned, label: next.dealer.lastCall, at: Date.now() });
  return { state: next, event: { type: "pulled", message: next.dealer.lastCall, returned } };
}

export function pressNumberBet(state, number, amount) {
  return placeBet(state, { type: "place", number, amount });
}

export function placeAiFieldBet(state, ownerId) {
  const player = state.players?.find((candidate) => candidate.id === ownerId);
  const amount = Math.max(state.table.min, player?.fieldUnit ?? state.table.min);
  if (!player || player.human || player.bankroll < amount) {
    return { state, event: { type: "noAction", message: `${player?.name ?? "Player"} waits this roll.` } };
  }
  const existingField = state.bets.some((bet) => bet.owner === ownerId && bet.type === "field");
  if (existingField) return { state, event: { type: "noAction", message: `${player.name} already has field action.` } };
  return placeBet(state, { type: "field", owner: ownerId, amount });
}

export function resolveRoll(state, dice) {
  const next = clone(state);
  const roll = dice ?? rollDice();
  const total = roll.total;
  const pointNumbers = getPointNumbers(next);
  const wasPointOn = Boolean(state.point);
  const messages = [];
  const payouts = [];
  const losses = [];
  const pushes = [];
  let removeIds = new Set();
  let pointChanged = false;
  let sevenOut = false;
  let madePoint = false;

  next.session.rolls += 1;
  next.rollHistory.unshift({ ...roll, point: next.point, shooter: next.shooters[next.shooterIndex], at: Date.now() });

  if (!next.point) {
    messages.push("Coming out!");
    if (next.table.crapless) {
      if (total === 7) {
        settleByType(next, "passLine", 1, payouts, removeIds);
        settleByType(next, "come", 1, payouts, removeIds);
        messages.push("Seven winner. Front line pays!");
      } else if (pointNumbers.includes(total)) {
        next.point = total;
        next.puck = "ON";
        pointChanged = true;
        messages.push(`Crapless point is ${total}. Mark it up.`);
        next.bets.forEach((bet) => {
          if (bet.type === "come" && !bet.number) bet.number = total;
        });
      }
    } else if ([7, 11].includes(total)) {
      settleByType(next, "passLine", 1, payouts, removeIds);
      settleByType(next, "dontPass", -1, losses, removeIds);
      settleByType(next, "dontCome", -1, losses, removeIds);
      settleByType(next, "come", 1, payouts, removeIds);
      messages.push("Winner front line!");
    } else if ([2, 3, 12].includes(total)) {
      settleByType(next, "passLine", -1, losses, removeIds);
      if (total === 12) {
        pushByType(next, "dontPass", pushes, removeIds);
      } else {
        settleByType(next, "dontPass", 1, payouts, removeIds);
      }
      messages.push(total === 12 ? "Twelve craps. Don't pass bars, push." : "Craps. Line away.");
    } else if (pointNumbers.includes(total)) {
      next.point = total;
      next.puck = "ON";
      pointChanged = true;
      messages.push(`Point is ${total}. Mark it up.`);
      next.bets.forEach((bet) => {
        if (bet.type === "come" && !bet.number) bet.number = total;
        if (bet.type === "dontCome" && !bet.number) bet.number = total;
      });
    }
  } else {
    if (total === next.point) {
      settleByType(next, "passLine", 1, payouts, removeIds);
      settleByType(next, "dontPass", -1, losses, removeIds);
      settleOddsBehind(next, "passLine", next.point, payouts, removeIds);
      loseOddsBehind(next, "dontPass", next.point, losses, removeIds);
      next.point = null;
      next.puck = "OFF";
      madePoint = true;
      pointChanged = true;
      next.session.pointsMade += 1;
      messages.push(`${total}, front line winner. Coming out!`);
    } else if (total === 7) {
      sevenOut = true;
      next.session.sevenOuts += 1;
      next.point = null;
      next.puck = "OFF";
      next.shooterIndex = (next.shooterIndex + 1) % next.shooters.length;
      messages.push(`Seven out. Dice move to ${next.shooters[next.shooterIndex]}.`);
      next.bets.forEach((bet) => {
        const winsOnSeven = ["dontPass", "dontCome", "lay"].includes(bet.type) || (bet.type === "odds" && ["dontPass", "dontCome"].includes(bet.parentType));
        if (winsOnSeven) {
          const target = bet.number || state.point;
          const ratio = bet.type === "lay" || bet.type === "odds" ? LAY_ODDS[target] : [1, 1];
          payBet(next, bet, ratio, payouts, removeIds, bet.type === "lay" ? 0.05 : 0);
        } else {
          loseBet(bet, losses, removeIds);
        }
      });
    }

    if (!sevenOut) resolveTravelingComeBets(next, total, payouts, losses, pushes, removeIds, messages);
  }

  if (!sevenOut) {
    resolveOneRollBets(next, roll, payouts, losses, removeIds, messages);
    if (wasPointOn) resolveNumberBets(next, roll, payouts, losses, removeIds, messages);
  }

  next.bets = next.bets.filter((bet) => !removeIds.has(bet.id));
  const won = payouts.reduce((sum, item) => sum + item.returned + item.profit, 0);
  const profit = payouts.reduce((sum, item) => sum + item.profit, 0);
  const lost = losses.reduce((sum, item) => sum + item.amount, 0);
  const playerProfit = payouts.filter((item) => item.owner === "player").reduce((sum, item) => sum + item.profit, 0);
  const playerLost = losses.filter((item) => item.owner === "player").reduce((sum, item) => sum + item.amount, 0);
  const callProfit = playerProfit || playerLost ? playerProfit : profit;
  const callLost = playerProfit || playerLost ? playerLost : lost;
  payouts.forEach((item) => adjustOwnerBankroll(next, item.owner, item.returned + item.profit));
  pushes.forEach((item) => adjustOwnerBankroll(next, item.owner, item.amount));
  next.session.totalWon += profit;
  next.session.totalLost += lost;
  next.session.wins += payouts.length;
  next.session.losses += losses.length;
  next.session.pushes += pushes.length;
  next.session.biggestWin = Math.max(next.session.biggestWin, profit);
  next.session.biggestLoss = Math.max(next.session.biggestLoss, lost);
  next.session.streak = profit > lost ? Math.max(1, next.session.streak + 1) : lost > profit ? Math.min(-1, next.session.streak - 1) : next.session.streak;
  next.session.hotRoll = Math.max(next.session.hotRoll, next.session.streak);
  next.session.coldRoll = Math.min(next.session.coldRoll, next.session.streak);
  next.dealer.lastCall = buildDealerCall(roll, messages, callProfit, callLost);
  next.ledger.unshift({ kind: callProfit >= callLost ? "win" : "loss", amount: callProfit - callLost, label: next.dealer.lastCall, at: Date.now() });

  return {
    state: next,
    event: {
      type: "rollResolved",
      roll,
      messages,
      payouts,
      losses,
      pushes,
      pointChanged,
      sevenOut,
      madePoint,
      net: profit - lost,
      dealerCall: next.dealer.lastCall
    }
  };
}

function resolveTravelingComeBets(state, total, payouts, losses, pushes, removeIds, messages) {
  const pointNumbers = getPointNumbers(state);
  state.bets.forEach((bet) => {
    if (bet.number === total && bet.type === "come") {
      payBet(state, bet, [1, 1], payouts, removeIds);
      settleOddsBehind(state, "come", total, payouts, removeIds);
    }
    if (total === 7 && bet.type === "dontCome" && bet.number) {
      payBet(state, bet, [1, 1], payouts, removeIds);
      settleOddsBehind(state, "dontCome", bet.number, payouts, removeIds, true);
    }
    if (bet.number === total && bet.type === "dontCome") loseBet(bet, losses, removeIds);
    if (bet.number === total && bet.type === "dontCome") loseOddsBehind(state, "dontCome", total, losses, removeIds);
  });

  if (state.table.crapless) {
    if (total === 7) {
      state.bets.filter((bet) => bet.type === "come" && !bet.number).forEach((bet) => payBet(state, bet, [1, 1], payouts, removeIds));
      state.bets.filter((bet) => bet.type === "dontCome" && !bet.number).forEach((bet) => loseBet(bet, losses, removeIds));
    } else if (pointNumbers.includes(total)) {
      state.bets.forEach((bet) => {
        if (bet.type === "come" && !bet.number) {
          bet.number = total;
          messages.push(`Come travels to ${total}.`);
        }
      });
    }
    return;
  }

  if ([7, 11].includes(total)) {
    state.bets.filter((bet) => bet.type === "come" && !bet.number).forEach((bet) => payBet(state, bet, [1, 1], payouts, removeIds));
    state.bets.filter((bet) => bet.type === "dontCome" && !bet.number).forEach((bet) => loseBet(bet, losses, removeIds));
  } else if ([2, 3, 12].includes(total)) {
    state.bets.filter((bet) => bet.type === "come" && !bet.number).forEach((bet) => loseBet(bet, losses, removeIds));
    state.bets.filter((bet) => bet.type === "dontCome" && !bet.number).forEach((bet) => total === 12 ? pushBet(bet, pushes, removeIds) : payBet(state, bet, [1, 1], payouts, removeIds));
  } else if (pointNumbers.includes(total)) {
    state.bets.forEach((bet) => {
      if ((bet.type === "come" || bet.type === "dontCome") && !bet.number) {
        bet.number = total;
        messages.push(`${bet.type === "come" ? "Come" : "Don't come"} travels to ${total}.`);
      }
    });
  }

}

function resolveOneRollBets(state, roll, payouts, losses, removeIds, messages) {
  const total = roll.total;
  state.bets.forEach((bet) => {
    if (bet.type === "field") {
      if ([2, 3, 4, 9, 10, 11, 12].includes(total)) {
        const ratio = total === 2 || total === 12 ? [2, 1] : [1, 1];
        payBet(state, bet, ratio, payouts, removeIds);
        messages.push("Field pays.");
      } else loseBet(bet, losses, removeIds);
    }
    if (bet.type === "proposition") {
      const win = propositionWin(bet.number, roll);
      if (win) payBet(state, bet, win, payouts, removeIds);
      else loseBet(bet, losses, removeIds);
    }
  });
}

function resolveNumberBets(state, roll, payouts, losses, removeIds, messages) {
  const total = roll.total;
  state.bets.forEach((bet) => {
    if (bet.type === "place" && bet.number === total) {
      payBet(state, bet, PLACE_PAYOUTS[total], payouts, removeIds, false);
      messages.push(`${total} easy, place bets pay.`);
    }
    if (bet.type === "buy" && bet.number === total) {
      payBet(state, bet, TRUE_ODDS[total], payouts, removeIds, 0.05);
      messages.push(`Buy ${total} pays true odds, vig collected.`);
    }
    if (bet.type === "lay" && bet.number === total) {
      loseBet(bet, losses, removeIds);
      messages.push(`Lay ${total} loses.`);
    }
    if (bet.type === "big" && bet.number === total) {
      payBet(state, bet, [1, 1], payouts, removeIds, false);
      messages.push(`Big ${total} pays even money.`);
    }
    if (bet.type === "hardways") {
      const hardway = HARDWAYS[bet.number];
      if (!hardway) return;
      if (roll.hard && total === hardway.total) {
        payBet(state, bet, [hardway.pays, 1], payouts, removeIds, false);
        messages.push(`Hard ${total}!`);
      } else if (total === hardway.total || total === 7) {
        loseBet(bet, losses, removeIds);
      }
    }
  });
}

function settleByType(state, type, direction, winsOrLosses, removeIds) {
  state.bets.filter((bet) => bet.type === type && !bet.number).forEach((bet) => {
    if (direction > 0) payBet(state, bet, [1, 1], winsOrLosses, removeIds);
    else loseBet(bet, winsOrLosses, removeIds);
  });
}

function settleOddsBehind(state, parentType, point, payouts, removeIds, lay = false) {
  state.bets
    .filter((bet) => bet.type === "odds" && bet.parentType === parentType && bet.number === point)
    .forEach((bet) => payBet(state, bet, lay ? LAY_ODDS[point] : TRUE_ODDS[point], payouts, removeIds));
}

function loseOddsBehind(state, parentType, point, losses, removeIds) {
  state.bets
    .filter((bet) => bet.type === "odds" && bet.parentType === parentType && bet.number === point)
    .forEach((bet) => loseBet(bet, losses, removeIds));
}

function pushByType(state, type, pushes, removeIds) {
  state.bets.filter((bet) => bet.type === type && !bet.number).forEach((bet) => pushBet(bet, pushes, removeIds));
}

function payBet(state, bet, ratio, payouts, removeIds, vig = 0) {
  const rawProfit = Math.floor((bet.amount * ratio[0]) / ratio[1]);
  const commission = vig ? Math.ceil(rawProfit * vig) : 0;
  const profit = Math.max(0, rawProfit - commission);
  const staysWorking = ["passLine", "field", "place", "buy", "big", "hardways"].includes(bet.type);
  const removed = !staysWorking || ["dontPass", "come", "dontCome", "odds", "proposition", "lay"].includes(bet.type);
  payouts.push({ id: bet.id, owner: bet.owner, label: betLabel(bet), amount: bet.amount, returned: removed ? bet.amount : 0, profit, commission });
  if (removed) removeIds.add(bet.id);
}

function loseBet(bet, losses, removeIds) {
  losses.push({ id: bet.id, owner: bet.owner, label: betLabel(bet), amount: bet.amount });
  removeIds.add(bet.id);
}

function pushBet(bet, pushes, removeIds) {
  pushes.push({ id: bet.id, owner: bet.owner, label: betLabel(bet), amount: bet.amount });
  removeIds.add(bet.id);
}

function propositionWin(number, roll) {
  if (number === "any7" && roll.total === 7) return [4, 1];
  if (number === "anyCraps" && [2, 3, 12].includes(roll.total)) return [7, 1];
  if (number === "yo" && roll.total === 11) return [15, 1];
  if (number === "aces" && roll.die1 === 1 && roll.die2 === 1) return [30, 1];
  if (number === "boxcars" && roll.die1 === 6 && roll.die2 === 6) return [30, 1];
  return null;
}

function buildDealerCall(roll, messages, profit, lost) {
  const face = roll.hard && [4, 6, 8, 10].includes(roll.total) ? `Hard ${roll.total}` : `${roll.total}`;
  const money = profit > lost ? ` Paid $${profit}.` : lost > profit ? ` Down $${lost}.` : "";
  return `${face}. ${messages[messages.length - 1] ?? "No roll."}${money}`;
}

function chipCall(amount, label, number) {
  return `$${amount} ${label}${number ? ` on ${number}` : ""}.`;
}

function validateOddsBet(state, bet) {
  const parentType = bet.parentType;
  const number = bet.number ?? state.point;
  if (!parentType || !number) return { ok: false, message: "Odds need an established point." };
  if (!["passLine", "dontPass", "come", "dontCome"].includes(parentType)) return { ok: false, message: "Odds need a line or come bet." };
  const hasFlatBet = state.bets.some((flatBet) => {
    if (flatBet.type !== parentType) return false;
    if (["passLine", "dontPass"].includes(parentType)) return Boolean(state.point);
    return Number(flatBet.number) === Number(number);
  });
  if (!hasFlatBet) return { ok: false, message: `Place the ${BET_CATALOG[parentType]?.label ?? parentType} bet before taking odds.` };
  return { ok: true };
}

export function betLabel(bet) {
  return `${BET_CATALOG[bet.type]?.label ?? bet.type}${bet.number ? ` ${bet.number}` : ""}`;
}

export function getPointNumbers(stateOrMode = "casino") {
  if (typeof stateOrMode === "string") return MODES[stateOrMode]?.crapless ? CRAPLESS_POINT_NUMBERS : POINT_NUMBERS;
  return stateOrMode?.table?.crapless ? CRAPLESS_POINT_NUMBERS : POINT_NUMBERS;
}

function clampToTable(amount, min, max) {
  return Math.max(min, Math.min(max, Math.round(amount || min)));
}

function getOwnerBankroll(state, owner = "player") {
  if (owner === "player") return state.bankroll;
  return state.players?.find((player) => player.id === owner)?.bankroll ?? 0;
}

function adjustOwnerBankroll(state, owner = "player", amount = 0) {
  if (!state.players) state.players = createTablePlayers(state.bankroll ?? 0, state.table?.min ?? 10);
  const player = state.players.find((candidate) => candidate.id === owner);
  if (player) player.bankroll += amount;
  if (owner === "player") state.bankroll += amount;
}

function playerName(state, owner = "player") {
  if (owner === "player") return "You";
  return state.players?.find((player) => player.id === owner)?.name ?? owner;
}

function cryptoId() {
  return `bet-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function strategyRecommendation(state) {
  const bankrollUnits = Math.floor(state.bankroll / state.table.min);
  if (!state.point) return bankrollUnits < 20 ? "Low pressure: one Pass Line unit, skip odds until you rebuild." : "Classic start: Pass Line, then take odds after a point.";
  if ([6, 8].includes(state.point)) return "Point is favorable for action: odds behind the line and controlled 6/8 exposure fit a steady profile.";
  if ([4, 10].includes(state.point)) return "Point is long: odds are fair, but keep place and prop exposure modest.";
  return "Balanced board: odds are mathematically clean; field and prop bets add volatility.";
}

export function multiplayerBlueprint() {
  return {
    transport: "WebSocket-ready event bus",
    events: ["table.join", "table.leave", "bet.place", "bet.remove", "dice.roll", "chat.message", "spectator.join"],
    persistence: ["players", "profiles", "sessions", "tables", "friendships", "achievements"],
    roles: ["shooter", "player", "spectator", "dealer", "moderator"]
  };
}
