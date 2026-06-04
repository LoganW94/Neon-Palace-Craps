const SUITS = ["spades", "hearts", "diamonds", "clubs"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const RANK_VALUE = Object.fromEntries(RANKS.map((rank, index) => [rank, index + 1]));

export const JACKS_OR_BETTER_PAYTABLE = [
  ["Royal Flush", 250],
  ["Straight Flush", 50],
  ["Four of a Kind", 25],
  ["Full House", 9],
  ["Flush", 6],
  ["Straight", 4],
  ["Three of a Kind", 3],
  ["Two Pair", 2],
  ["Jacks or Better", 1]
];

export const DEUCES_WILD_ULTIMATE_X_PAYTABLE = [
  ["Natural Royal Flush", 800],
  ["Four Deuces", 200],
  ["Wild Royal Flush", 25],
  ["Five of a Kind", 15],
  ["Straight Flush", 9],
  ["Four of a Kind", 5],
  ["Full House", 3],
  ["Flush", 2],
  ["Straight", 2],
  ["Three of a Kind", 1]
];

export const BONUS_POKER_PAYTABLE = [
  ["Royal Flush", 250],
  ["Straight Flush", 50],
  ["Four Aces", 80],
  ["Four 2s, 3s, or 4s", 40],
  ["Four 5s through Kings", 25],
  ["Full House", 8],
  ["Flush", 5],
  ["Straight", 4],
  ["Three of a Kind", 3],
  ["Two Pair", 2],
  ["Jacks or Better", 1]
];

export const ULTIMATE_X_MULTIPLIERS = {
  "Natural Royal Flush": 12,
  "Four Deuces": 12,
  "Wild Royal Flush": 10,
  "Five of a Kind": 8,
  "Straight Flush": 7,
  "Four of a Kind": 4,
  "Full House": 3,
  Flush: 2,
  Straight: 2,
  "Three of a Kind": 2,
  "No Win": 1
};

export function createVideoPokerState(bankroll = 1000) {
  return {
    bankroll,
    buyIn: bankroll,
    wager: 0.25,
    hands: 1,
    deck: [],
    hand: [],
    finalHands: [],
    results: [],
    held: [false, false, false, false, false],
    status: "idle",
    result: "Insert credits and deal.",
    lastPayout: 0,
    handsPlayed: 0,
    bestHand: null
  };
}

export function createUltimateXState(bankroll = 1500) {
  return {
    bankroll,
    buyIn: bankroll,
    wager: 0.25,
    hands: 1,
    deck: [],
    hand: [],
    finalHands: [],
    results: [],
    held: [false, false, false, false, false],
    status: "idle",
    result: "Deuces are wild. Insert credits and deal.",
    lastPayout: 0,
    handsPlayed: 0,
    bestHand: null,
    activeMultiplier: 1,
    nextMultiplier: 1,
    activeMultipliers: [1],
    nextMultipliers: [1]
  };
}

export function createBonusPokerState(bankroll = 1000) {
  return {
    bankroll,
    buyIn: bankroll,
    wager: 0.25,
    hands: 1,
    deck: [],
    hand: [],
    finalHands: [],
    results: [],
    held: [false, false, false, false, false],
    status: "idle",
    result: "Bonus Poker pays extra for premium four of a kinds.",
    lastPayout: 0,
    handsPlayed: 0,
    bestHand: null
  };
}

export function setVideoPokerHands(state, hands) {
  if (state.status === "dealt") return state;
  return { ...state, hands: clampHands(hands) };
}

export function setUltimateXHands(state, hands) {
  if (state.status === "dealt") return state;
  const count = clampHands(hands);
  return {
    ...state,
    hands: count,
    activeMultipliers: normalizeMultipliers(state.activeMultipliers, count, 1),
    nextMultipliers: normalizeMultipliers(state.nextMultipliers, count, 1)
  };
}

export function setBonusPokerHands(state, hands) {
  if (state.status === "dealt") return state;
  return { ...state, hands: clampHands(hands) };
}

export function dealVideoPoker(state, wager, hands = state.hands) {
  if (state.status === "dealt") return { state, event: { type: "rejected", message: "Draw or hold cards before dealing again." } };
  const handCount = clampHands(hands);
  const totalWager = cents(wager * handCount);
  if (wager < 0.01 || totalWager > state.bankroll) return { state, event: { type: "rejected", message: "Choose credits within your bankroll." } };
  const deck = state.deck.length >= 5 ? [...state.deck] : shuffledDeck();
  const hand = deck.splice(0, 5);
  return {
    state: {
      ...state,
      bankroll: cents(state.bankroll - totalWager),
      wager,
      hands: handCount,
      deck,
      hand,
      finalHands: [],
      results: [],
      held: [false, false, false, false, false],
      status: "dealt",
      result: `Choose holds, then draw ${handCount} hand${handCount === 1 ? "" : "s"}.`,
      lastPayout: 0
    },
    event: { type: "pokerDealt", message: "Jacks or Better. Hold what you like." }
  };
}

export function toggleVideoPokerHold(state, index) {
  if (state.status !== "dealt") return state;
  const held = [...state.held];
  held[index] = !held[index];
  return { ...state, held };
}

export function drawVideoPoker(state) {
  if (state.status !== "dealt") return { state, event: { type: "rejected", message: "Deal a hand first." } };
  const finalHands = Array.from({ length: state.hands }, (_, handIndex) => completeDrawHand(state, handIndex));
  const results = finalHands.map(evaluateJacksOrBetter);
  const payout = cents(results.reduce((sum, result) => sum + state.wager * result.multiplier, 0));
  const bestResult = results.reduce((best, result) => bestPokerHand(best, result), null);
  const winningHands = results.filter((result) => result.multiplier > 0).length;
  const resultText = winningHands
    ? `${winningHands}/${state.hands} hands pay. Best: ${bestResult.name}.`
    : `No paying hands across ${state.hands}.`;
  return {
    state: {
      ...state,
      bankroll: cents(state.bankroll + payout),
      deck: [],
      hand: finalHands[0] ?? state.hand,
      finalHands,
      results,
      status: "complete",
      result: resultText,
      lastPayout: payout,
      handsPlayed: state.handsPlayed + state.hands,
      bestHand: bestPokerHand(state.bestHand, bestResult)
    },
    event: { type: "pokerDrawn", message: resultText, payout }
  };
}

export function dealBonusPoker(state, wager, hands = state.hands) {
  if (state.status === "dealt") return { state, event: { type: "rejected", message: "Draw or hold cards before dealing again." } };
  const handCount = clampHands(hands);
  const totalWager = cents(wager * handCount);
  if (wager < 0.01 || totalWager > state.bankroll) return { state, event: { type: "rejected", message: "Choose credits within your bankroll." } };
  const deck = state.deck.length >= 5 ? [...state.deck] : shuffledDeck();
  const hand = deck.splice(0, 5);
  return {
    state: {
      ...state,
      bankroll: cents(state.bankroll - totalWager),
      wager,
      hands: handCount,
      deck,
      hand,
      finalHands: [],
      results: [],
      held: [false, false, false, false, false],
      status: "dealt",
      result: `Choose holds, then draw ${handCount} hand${handCount === 1 ? "" : "s"}.`,
      lastPayout: 0
    },
    event: { type: "bonusPokerDealt", message: "Bonus Poker. Hold your best draw." }
  };
}

export function toggleBonusPokerHold(state, index) {
  if (state.status !== "dealt") return state;
  const held = [...state.held];
  held[index] = !held[index];
  return { ...state, held };
}

export function drawBonusPoker(state) {
  if (state.status !== "dealt") return { state, event: { type: "rejected", message: "Deal a Bonus Poker hand first." } };
  const finalHands = Array.from({ length: state.hands }, (_, handIndex) => completeDrawHand(state, handIndex));
  const results = finalHands.map(evaluateBonusPoker);
  const payout = cents(results.reduce((sum, result) => sum + state.wager * result.multiplier, 0));
  const bestResult = results.reduce((best, result) => bestPokerHand(best, result), null);
  const winningHands = results.filter((result) => result.multiplier > 0).length;
  const resultText = winningHands
    ? `${winningHands}/${state.hands} hands pay. Best: ${bestResult.name}.`
    : `No paying hands across ${state.hands}.`;
  return {
    state: {
      ...state,
      bankroll: cents(state.bankroll + payout),
      deck: [],
      hand: finalHands[0] ?? state.hand,
      finalHands,
      results,
      status: "complete",
      result: resultText,
      lastPayout: payout,
      handsPlayed: state.handsPlayed + state.hands,
      bestHand: bestPokerHand(state.bestHand, bestResult)
    },
    event: { type: "bonusPokerDrawn", message: resultText, payout }
  };
}

export function dealUltimateX(state, wager, hands = state.hands) {
  if (state.status === "dealt") return { state, event: { type: "rejected", message: "Draw before dealing again." } };
  const handCount = clampHands(hands);
  const totalWager = cents(wager * handCount);
  if (wager < 0.01 || totalWager > state.bankroll) return { state, event: { type: "rejected", message: "Choose credits within your bankroll." } };
  const deck = state.deck.length >= 5 ? [...state.deck] : shuffledDeck();
  const hand = deck.splice(0, 5);
  return {
    state: {
      ...state,
      bankroll: cents(state.bankroll - totalWager),
      wager,
      hands: handCount,
      deck,
      hand,
      finalHands: [],
      results: [],
      held: [false, false, false, false, false],
      status: "dealt",
      result: `Deuces are wild. Hold, then draw ${handCount} hand${handCount === 1 ? "" : "s"}.`,
      lastPayout: 0,
      activeMultiplier: 1,
      nextMultiplier: 1,
      activeMultipliers: Array.from({ length: handCount }, () => 1),
      nextMultipliers: Array.from({ length: handCount }, () => 1)
    },
    event: { type: "deucesWildDealt", message: "Deuces Wild. Deuces are wild." }
  };
}

export function toggleUltimateXHold(state, index) {
  if (state.status !== "dealt") return state;
  const held = [...state.held];
  held[index] = !held[index];
  return { ...state, held };
}

export function drawUltimateX(state) {
  if (state.status !== "dealt") return { state, event: { type: "rejected", message: "Deal a Deuces Wild hand first." } };
  const finalHands = Array.from({ length: state.hands }, (_, handIndex) => completeDrawHand(state, handIndex));
  const results = finalHands.map(evaluateDeucesWild);
  const payout = cents(results.reduce((sum, result) => sum + state.wager * result.multiplier, 0));
  const bestResult = results.reduce((best, result) => bestPokerHand(best, result), null);
  const winningHands = results.filter((result) => result.multiplier > 0).length;
  const resultText = winningHands
    ? `${winningHands}/${state.hands} hands pay. Best: ${bestResult.name}.`
    : `No paying hands across ${state.hands}.`;
  return {
    state: {
      ...state,
      bankroll: cents(state.bankroll + payout),
      deck: [],
      hand: finalHands[0] ?? state.hand,
      finalHands,
      results,
      status: "complete",
      result: resultText,
      lastPayout: payout,
      handsPlayed: state.handsPlayed + state.hands,
      bestHand: bestPokerHand(state.bestHand, bestResult),
      activeMultiplier: 1,
      nextMultiplier: 1,
      activeMultipliers: Array.from({ length: state.hands }, () => 1),
      nextMultipliers: Array.from({ length: state.hands }, () => 1)
    },
    event: { type: "deucesWildDrawn", message: resultText, payout }
  };
}

export function evaluateJacksOrBetter(hand) {
  const ranks = hand.map((card) => card.rank);
  const values = ranks.map((rank) => RANK_VALUE[rank]).sort((a, b) => a - b);
  const counts = countValues(ranks);
  const groups = Object.values(counts).sort((a, b) => b - a);
  const isFlush = hand.every((card) => card.suit === hand[0].suit);
  const isRoyal = isFlush && ["10", "J", "Q", "K", "A"].every((rank) => ranks.includes(rank));
  const isStraight = unique(values).length === 5 && (values[4] - values[0] === 4 || values.join(",") === "1,2,3,4,5");

  if (isRoyal) return namedPokerResult("Royal Flush", 250);
  if (isFlush && isStraight) return namedPokerResult("Straight Flush", 50);
  if (groups[0] === 4) return namedPokerResult("Four of a Kind", 25);
  if (groups[0] === 3 && groups[1] === 2) return namedPokerResult("Full House", 9);
  if (isFlush) return namedPokerResult("Flush", 6);
  if (isStraight) return namedPokerResult("Straight", 4);
  if (groups[0] === 3) return namedPokerResult("Three of a Kind", 3);
  if (groups[0] === 2 && groups[1] === 2) return namedPokerResult("Two Pair", 2);
  const highPair = Object.entries(counts).some(([rank, count]) => count === 2 && ["J", "Q", "K", "A"].includes(rank));
  if (highPair) return namedPokerResult("Jacks or Better", 1);
  return namedPokerResult("No Win", 0);
}

export function evaluateBonusPoker(hand) {
  const ranks = hand.map((card) => card.rank);
  const values = ranks.map((rank) => RANK_VALUE[rank]).sort((a, b) => a - b);
  const counts = countValues(ranks);
  const groups = Object.values(counts).sort((a, b) => b - a);
  const isFlush = hand.every((card) => card.suit === hand[0].suit);
  const isRoyal = isFlush && ["10", "J", "Q", "K", "A"].every((rank) => ranks.includes(rank));
  const isStraight = unique(values).length === 5 && (values[4] - values[0] === 4 || values.join(",") === "1,2,3,4,5");

  if (isRoyal) return namedPokerResult("Royal Flush", 250);
  if (isFlush && isStraight) return namedPokerResult("Straight Flush", 50);
  const fourRank = Object.entries(counts).find(([, count]) => count === 4)?.[0];
  if (fourRank === "A") return namedPokerResult("Four Aces", 80);
  if (["2", "3", "4"].includes(fourRank)) return namedPokerResult("Four 2s, 3s, or 4s", 40);
  if (fourRank) return namedPokerResult("Four 5s through Kings", 25);
  if (groups[0] === 3 && groups[1] === 2) return namedPokerResult("Full House", 8);
  if (isFlush) return namedPokerResult("Flush", 5);
  if (isStraight) return namedPokerResult("Straight", 4);
  if (groups[0] === 3) return namedPokerResult("Three of a Kind", 3);
  if (groups[0] === 2 && groups[1] === 2) return namedPokerResult("Two Pair", 2);
  const highPair = Object.entries(counts).some(([rank, count]) => count === 2 && ["J", "Q", "K", "A"].includes(rank));
  if (highPair) return namedPokerResult("Jacks or Better", 1);
  return namedPokerResult("No Win", 0);
}

export function evaluateDeucesWild(hand) {
  const wilds = hand.filter((card) => card.rank === "2").length;
  const naturals = hand.filter((card) => card.rank !== "2");
  const ranks = naturals.map((card) => card.rank);
  const values = ranks.map((rank) => RANK_VALUE[rank]).sort((a, b) => a - b);
  const counts = countValues(ranks);
  const groups = Object.values(counts).sort((a, b) => b - a);
  const naturalFlush = naturals.length > 0 && naturals.every((card) => card.suit === naturals[0].suit);
  const naturalRoyal = wilds === 0 && naturalFlush && ["10", "J", "Q", "K", "A"].every((rank) => ranks.includes(rank));
  if (naturalRoyal) return namedPokerResult("Natural Royal Flush", 800);
  if (wilds === 4) return namedPokerResult("Four Deuces", 200);
  if (canMakeWildRoyal(naturals, wilds)) return namedPokerResult("Wild Royal Flush", 25);
  if (Object.values(counts).some((count) => count + wilds >= 5)) return namedPokerResult("Five of a Kind", 15);
  if (naturalFlush && canMakeStraight(values, wilds)) return namedPokerResult("Straight Flush", 9);
  if (Object.values(counts).some((count) => count + wilds >= 4)) return namedPokerResult("Four of a Kind", 5);
  if (canMakeFullHouse(groups, wilds)) return namedPokerResult("Full House", 3);
  if (naturalFlush) return namedPokerResult("Flush", 2);
  if (canMakeStraight(values, wilds)) return namedPokerResult("Straight", 2);
  if (Object.values(counts).some((count) => count + wilds >= 3) || wilds >= 3) return namedPokerResult("Three of a Kind", 1);
  return namedPokerResult("No Win", 0);
}

export function createBlackjackState(bankroll = 2000) {
  return {
    bankroll,
    buyIn: bankroll,
    wager: 25,
    deck: shuffledDeck(6),
    player: [],
    dealer: [],
    status: "idle",
    message: "Place a bet to start a blackjack hand.",
    lastOutcome: null,
    handsPlayed: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    doubled: false,
    splitHands: null,
    activeHandIndex: 0
  };
}

export function startBlackjackHand(state, wager) {
  if (state.status === "player") return { state, event: { type: "rejected", message: "Finish the current hand first." } };
  if (wager < 1 || wager > state.bankroll) return { state, event: { type: "rejected", message: "Choose a wager within your bankroll." } };
  const deck = state.deck.length < 78 ? shuffledDeck(6) : [...state.deck];
  const player = [deck.shift(), deck.shift()];
  const dealer = [deck.shift(), deck.shift()];
  const next = { ...state, bankroll: state.bankroll - wager, wager, deck, player, dealer, status: "player", message: "Your action.", doubled: false, splitHands: null, activeHandIndex: 0 };
  if (isBlackjack(player) || isBlackjack(dealer)) return settleBlackjack(next);
  return { state: next, event: { type: "blackjackDealt", message: "Blackjack hand dealt." } };
}

export function blackjackPlayerAction(state, action) {
  if (state.status !== "player") return { state, event: { type: "rejected", message: "Deal a blackjack hand first." } };
  if (action === "split") return splitBlackjackHand(state);
  if (state.splitHands) return splitBlackjackAction(state, action);
  if (action === "hit") {
    const deck = [...state.deck];
    const player = [...state.player, deck.shift()];
    const next = { ...state, deck, player, message: "Card." };
    return handValue(player).total > 21 ? settleBlackjack(next) : { state: next, event: { type: "blackjackHit", message: "Card." } };
  }
  if (action === "double") {
    if (state.player.length !== 2 || state.bankroll < state.wager) return { state, event: { type: "rejected", message: "Double is only available on your first two cards with enough bankroll." } };
    const deck = [...state.deck];
    const player = [...state.player, deck.shift()];
    return settleBlackjack({ ...state, deck, player, bankroll: state.bankroll - state.wager, wager: state.wager * 2, doubled: true });
  }
  if (action === "stand") return settleBlackjack(state);
  return { state, event: { type: "rejected", message: "Unknown blackjack action." } };
}

export function blackjackGuide(player, dealerUp, canDouble = true) {
  if (!player.length || !dealerUp) return "Deal a hand to see the recommended play.";
  const dealer = blackjackCardValue(dealerUp);
  const value = handValue(player);
  const pairRank = player.length === 2 && player[0].rank === player[1].rank ? player[0].rank : null;
  if (pairRank === "A" || pairRank === "8") return "Split. This is usually one of the strongest pair plays.";
  if (pairRank === "10") return "Stand. A made 20 is too valuable to split.";
  if (pairRank === "5" && canDouble && dealer <= 9) return "Double. Pair of 5s plays as hard 10.";
  if (value.soft) {
    if (value.total >= 19) return "Stand. Soft 19 or better is strong.";
    if (canDouble && value.total === 18 && dealer >= 3 && dealer <= 6) return "Double soft 18 against 3 through 6.";
    if (value.total === 18) return dealer >= 9 ? "Hit soft 18 against 9, 10, or Ace." : "Stand on soft 18.";
    if (canDouble && value.total >= 13 && value.total <= 17 && dealer >= 4 && dealer <= 6) return "Double the soft hand against a weak dealer card.";
    return "Hit. Soft totals can improve without immediate bust risk.";
  }
  if (value.total >= 17) return "Stand. Hard 17 or better is a pat hand.";
  if (value.total >= 13) return dealer <= 6 ? "Stand. Let the dealer draw into the weak up-card." : "Hit. Dealer has the pressure card.";
  if (value.total === 12) return dealer >= 4 && dealer <= 6 ? "Stand on 12 against 4 through 6." : "Hit hard 12 against 2, 3, or 7+.";
  if (value.total === 11 && canDouble) return "Double against any dealer card except use caution against Ace.";
  if (value.total === 10 && canDouble && dealer <= 9) return "Double hard 10 against 2 through 9.";
  if (value.total === 9 && canDouble && dealer >= 3 && dealer <= 6) return "Double hard 9 against 3 through 6.";
  return "Hit. Build the hand before standing.";
}

export function blackjackOddsSummary() {
  return [
    ["Blackjack payout", "3:2"],
    ["Dealer rule", "Stands on soft 17"],
    ["House edge", "~0.5% with basic strategy"],
    ["Insurance", "Not offered here"],
    ["Best habit", "Double and stand by dealer up-card"]
  ];
}

export function handValue(hand) {
  let total = hand.reduce((sum, card) => sum + blackjackCardValue(card), 0);
  let aces = hand.filter((card) => card.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: hand.some((card) => card.rank === "A") && total <= 21 && aces > 0 };
}

function settleBlackjack(state) {
  if (state.splitHands) return settleSplitBlackjack(state);
  let deck = [...state.deck];
  let dealer = [...state.dealer];
  let playerValue = handValue(state.player);
  let dealerValue = handValue(dealer);
  if (playerValue.total <= 21 && !isBlackjack(state.player)) {
    while (dealerValue.total < 17) {
      dealer.push(deck.shift());
      dealerValue = handValue(dealer);
    }
  }
  const playerBlackjack = isBlackjack(state.player);
  const dealerBlackjack = isBlackjack(dealer);
  let payout = 0;
  let outcome = "loss";
  let message = "Dealer wins.";
  if (playerBlackjack && !dealerBlackjack) {
    payout = state.wager * 2.5;
    outcome = "win";
    message = "Blackjack pays 3 to 2.";
  } else if (playerBlackjack && dealerBlackjack) {
    payout = state.wager;
    outcome = "push";
    message = "Push.";
  } else if (playerValue.total > 21) {
    message = "Player busts.";
  } else if (dealerValue.total > 21 || playerValue.total > dealerValue.total) {
    payout = state.wager * 2;
    outcome = "win";
    message = "Player wins.";
  } else if (playerValue.total === dealerValue.total) {
    payout = state.wager;
    outcome = "push";
    message = "Push.";
  }
  return {
    state: {
      ...state,
      deck,
      dealer,
      bankroll: state.bankroll + payout,
      status: "complete",
      message,
      lastOutcome: outcome,
      handsPlayed: state.handsPlayed + 1,
      wins: state.wins + (outcome === "win" ? 1 : 0),
      losses: state.losses + (outcome === "loss" ? 1 : 0),
      pushes: state.pushes + (outcome === "push" ? 1 : 0)
    },
    event: { type: "blackjackSettled", message, payout, outcome }
  };
}

function splitBlackjackHand(state) {
  if (state.splitHands) return { state, event: { type: "rejected", message: "This hand is already split." } };
  if (state.player.length !== 2 || state.player[0].rank !== state.player[1].rank) {
    return { state, event: { type: "rejected", message: "Split is only available on a matching pair." } };
  }
  if (state.bankroll < state.wager) {
    return { state, event: { type: "rejected", message: "Not enough credits to split." } };
  }
  const deck = [...state.deck];
  const splitHands = [
    { cards: [state.player[0], deck.shift()], wager: state.wager, doubled: false, status: "active", outcome: null, payout: 0, message: "" },
    { cards: [state.player[1], deck.shift()], wager: state.wager, doubled: false, status: "waiting", outcome: null, payout: 0, message: "" }
  ];
  return {
    state: {
      ...state,
      deck,
      bankroll: state.bankroll - state.wager,
      player: splitHands[0].cards,
      splitHands,
      activeHandIndex: 0,
      message: "Split. Play hand 1."
    },
    event: { type: "blackjackSplit", message: "Split into two hands." }
  };
}

function splitBlackjackAction(state, action) {
  const index = state.activeHandIndex ?? 0;
  const splitHands = state.splitHands.map((hand) => ({ ...hand, cards: [...hand.cards] }));
  const hand = splitHands[index];
  if (!hand || hand.status === "done") return settleSplitBlackjack({ ...state, splitHands });
  if (action === "hit") {
    const deck = [...state.deck];
    hand.cards.push(deck.shift());
    const value = handValue(hand.cards);
    if (value.total > 21) {
      hand.status = "done";
      hand.outcome = "loss";
      hand.message = `Hand ${index + 1} busts.`;
      return advanceSplitHand({ ...state, deck, splitHands }, hand.message);
    }
    hand.status = "active";
    return {
      state: { ...state, deck, splitHands, player: hand.cards, message: `Hand ${index + 1}.` },
      event: { type: "blackjackHit", message: "Card." }
    };
  }
  if (action === "double") {
    if (hand.cards.length !== 2 || state.bankroll < hand.wager) return { state, event: { type: "rejected", message: "Double is only available on the first two cards with enough credits." } };
    const deck = [...state.deck];
    hand.cards.push(deck.shift());
    hand.doubled = true;
    hand.wager *= 2;
    hand.status = "done";
    if (handValue(hand.cards).total > 21) {
      hand.outcome = "loss";
      hand.message = `Hand ${index + 1} busts.`;
    }
    return advanceSplitHand({ ...state, deck, bankroll: state.bankroll - (hand.wager / 2), splitHands }, hand.message || `Hand ${index + 1} doubles.`);
  }
  if (action === "stand") {
    hand.status = "done";
    return advanceSplitHand({ ...state, splitHands }, `Hand ${index + 1} stands.`);
  }
  return { state, event: { type: "rejected", message: "Unknown blackjack action." } };
}

function advanceSplitHand(state, message) {
  const nextIndex = state.splitHands.findIndex((hand) => hand.status !== "done");
  if (nextIndex === -1) return settleSplitBlackjack({ ...state, message });
  const splitHands = state.splitHands.map((hand, index) => ({ ...hand, status: index === nextIndex ? "active" : hand.status }));
  return {
    state: { ...state, splitHands, activeHandIndex: nextIndex, player: splitHands[nextIndex].cards, message: `${message} Play hand ${nextIndex + 1}.` },
    event: { type: "blackjackAdvance", message: `${message} Play hand ${nextIndex + 1}.` }
  };
}

function settleSplitBlackjack(state) {
  let deck = [...state.deck];
  let dealer = [...state.dealer];
  let dealerValue = handValue(dealer);
  const liveHand = state.splitHands.some((hand) => handValue(hand.cards).total <= 21);
  if (liveHand) {
    while (dealerValue.total < 17) {
      dealer.push(deck.shift());
      dealerValue = handValue(dealer);
    }
  }
  let bankroll = state.bankroll;
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  const settledHands = state.splitHands.map((hand, index) => {
    const value = handValue(hand.cards);
    let outcome = hand.outcome ?? "loss";
    let payout = 0;
    let message = hand.message || `Hand ${index + 1}: dealer wins.`;
    if (value.total > 21) {
      outcome = "loss";
      message = `Hand ${index + 1}: bust.`;
    } else if (dealerValue.total > 21 || value.total > dealerValue.total) {
      payout = hand.wager * 2;
      outcome = "win";
      message = `Hand ${index + 1}: wins.`;
    } else if (value.total === dealerValue.total) {
      payout = hand.wager;
      outcome = "push";
      message = `Hand ${index + 1}: push.`;
    }
    bankroll += payout;
    wins += outcome === "win" ? 1 : 0;
    losses += outcome === "loss" ? 1 : 0;
    pushes += outcome === "push" ? 1 : 0;
    return { ...hand, status: "done", outcome, payout, message };
  });
  const message = settledHands.map((hand) => hand.message).join(" ");
  const outcome = wins > 0 ? "win" : pushes > 0 && losses === 0 ? "push" : "loss";
  return {
    state: {
      ...state,
      deck,
      dealer,
      bankroll,
      player: settledHands[state.activeHandIndex ?? 0]?.cards ?? state.player,
      splitHands: settledHands,
      status: "complete",
      message,
      lastOutcome: outcome,
      handsPlayed: state.handsPlayed + settledHands.length,
      wins: state.wins + wins,
      losses: state.losses + losses,
      pushes: state.pushes + pushes
    },
    event: { type: "blackjackSettled", message, payout: settledHands.reduce((sum, hand) => sum + hand.payout, 0), outcome }
  };
}

function isBlackjack(hand) {
  return hand.length === 2 && handValue(hand).total === 21;
}

function blackjackCardValue(card) {
  if (card.rank === "A") return 11;
  if (["K", "Q", "J"].includes(card.rank)) return 10;
  return Number(card.rank);
}

function shuffledDeck(decks = 1) {
  const cards = [];
  for (let deck = 0; deck < decks; deck += 1) {
    SUITS.forEach((suit) => RANKS.forEach((rank) => cards.push({ rank, suit })));
  }
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function shuffledDeckExcluding(excluded) {
  const blocked = new Set(excluded.map(cardKey));
  return shuffledDeck().filter((card) => !blocked.has(cardKey(card)));
}

function completeDrawHand(state, handIndex) {
  const heldCards = state.hand.filter((_, index) => state.held[index]);
  const deck = handIndex === 0 ? [...state.deck] : shuffledDeckExcluding(heldCards);
  return state.hand.map((card, index) => state.held[index] ? card : deck.shift());
}

function cardKey(card) {
  return `${card.rank}-${card.suit}`;
}

function clampHands(hands) {
  return Math.max(1, Math.min(10, Number(hands) || 1));
}

function normalizeMultipliers(multipliers = [], count = 1, fallback = 1) {
  return Array.from({ length: count }, (_, index) => multipliers[index] ?? fallback);
}

function cents(value) {
  return Math.round(value * 100) / 100;
}

function countValues(values) {
  return values.reduce((counts, value) => ({ ...counts, [value]: (counts[value] ?? 0) + 1 }), {});
}

function unique(values) {
  return [...new Set(values)];
}

function canMakeWildRoyal(cards, wilds) {
  return SUITS.some((suit) => {
    const suited = cards.filter((card) => card.suit === suit);
    if (suited.length !== cards.length) return false;
    const needed = ["10", "J", "Q", "K", "A"].filter((rank) => !suited.some((card) => card.rank === rank));
    return needed.length <= wilds;
  });
}

function canMakeStraight(values, wilds) {
  const normalized = unique(values.flatMap((value) => value === 1 ? [1, 14] : [value]));
  const starts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return starts.some((start) => {
    const run = [start, start + 1, start + 2, start + 3, start + 4];
    const hits = run.filter((value) => normalized.includes(value)).length;
    return 5 - hits <= wilds;
  });
}

function canMakeFullHouse(groups, wilds) {
  for (let tripIndex = 0; tripIndex < Math.max(groups.length, 1); tripIndex += 1) {
    const tripCount = groups[tripIndex] ?? 0;
    const wildsForTrip = Math.max(0, 3 - tripCount);
    if (wildsForTrip > wilds) continue;
    const remainingWilds = wilds - wildsForTrip;
    for (let pairIndex = 0; pairIndex < Math.max(groups.length, 2); pairIndex += 1) {
      if (pairIndex === tripIndex) continue;
      const pairCount = groups[pairIndex] ?? 0;
      if (Math.max(0, 2 - pairCount) <= remainingWilds) return true;
    }
  }
  return false;
}

function namedPokerResult(name, multiplier) {
  return { name, multiplier };
}

function bestPokerHand(best, result) {
  if (!best || result.multiplier > best.multiplier) return result;
  return best;
}
