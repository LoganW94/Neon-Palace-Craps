import assert from "node:assert/strict";
import { blackjackPlayerAction, createBlackjackState, createUltimateXState, createVideoPokerState, dealUltimateX, dealVideoPoker, drawUltimateX, drawVideoPoker, evaluateDeucesWild, evaluateJacksOrBetter, startBlackjackHand } from "../shared/casino-games.mjs";

const card = (rank, suit = "spades") => ({ rank, suit });
const shoe = (cards) => [...cards, ...Array.from({ length: 80 }, () => card("2", "clubs"))];

assert.equal(evaluateJacksOrBetter([card("10"), card("J"), card("Q"), card("K"), card("A")]).name, "Royal Flush");
assert.equal(evaluateJacksOrBetter([card("9"), card("10"), card("J"), card("Q"), card("K")]).multiplier, 50);
assert.equal(evaluateJacksOrBetter([card("J"), card("J", "hearts"), card("4"), card("8"), card("2")]).multiplier, 1);
assert.equal(evaluateJacksOrBetter([card("10"), card("10", "hearts"), card("4"), card("8"), card("2")]).multiplier, 0);
assert.equal(evaluateDeucesWild([card("10"), card("J"), card("Q"), card("K"), card("A")]).name, "Natural Royal Flush");
assert.equal(evaluateDeucesWild([card("2"), card("2", "hearts"), card("2", "diamonds"), card("2", "clubs"), card("A")]).name, "Four Deuces");
assert.equal(evaluateDeucesWild([card("2"), card("10"), card("J"), card("Q"), card("K")]).name, "Wild Royal Flush");
assert.equal(evaluateDeucesWild([card("2"), card("9"), card("9", "hearts"), card("9", "diamonds"), card("9", "clubs")]).name, "Five of a Kind");

let multiPoker = createVideoPokerState(10);
multiPoker.deck = [
  card("J"), card("J", "hearts"), card("4"), card("8"), card("2"),
  ...Array.from({ length: 47 }, () => card("3", "clubs"))
];
multiPoker = dealVideoPoker(multiPoker, 0.05, 3).state;
assert.equal(multiPoker.bankroll, 9.85);
multiPoker.held = [true, true, true, true, true];
const multiPokerResult = drawVideoPoker(multiPoker);
assert.equal(multiPokerResult.state.lastPayout, 0.15);
assert.equal(multiPokerResult.state.handsPlayed, 3);

let blackjack = createBlackjackState(1000);
blackjack.deck = shoe([
  card("A"), card("K"), card("9"), card("7"),
  card("5"), card("6")
]);
const natural = startBlackjackHand(blackjack, 100);
assert.equal(natural.state.bankroll, 1150);
assert.equal(natural.state.message, "Blackjack pays 3 to 2.");

blackjack = createBlackjackState(1000);
blackjack.deck = shoe([
  card("10"), card("6"), card("9"), card("7"),
  card("K")
]);
let hand = startBlackjackHand(blackjack, 100);
hand = blackjackPlayerAction(hand.state, "hit");
assert.equal(hand.state.lastOutcome, "loss");
assert.equal(hand.state.bankroll, 900);

let ultimateX = createUltimateXState(1000);
ultimateX.deck = [
  card("2"), card("9"), card("9", "hearts"), card("9", "diamonds"), card("9", "clubs"),
  ...Array.from({ length: 47 }, () => card("3", "clubs"))
];
ultimateX = dealUltimateX(ultimateX, 25).state;
const ultimateResult = drawUltimateX(ultimateX);
assert.equal(ultimateResult.state.lastPayout, 375);
assert.equal(ultimateResult.state.nextMultiplier, 8);

console.log("Casino card-game tests passed");
