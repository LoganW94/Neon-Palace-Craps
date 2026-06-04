import assert from "node:assert/strict";
import { blackjackPlayerAction, createBlackjackState, createBonusPokerState, createUltimateXState, createVideoPokerState, dealBonusPoker, dealUltimateX, dealVideoPoker, drawBonusPoker, drawUltimateX, drawVideoPoker, evaluateBonusPoker, evaluateDeucesWild, evaluateJacksOrBetter, startBlackjackHand } from "../shared/casino-games.mjs";

const card = (rank, suit = "spades") => ({ rank, suit });
const shoe = (cards) => [...cards, ...Array.from({ length: 80 }, () => card("2", "clubs"))];

assert.equal(evaluateJacksOrBetter([card("10"), card("J"), card("Q"), card("K"), card("A")]).name, "Royal Flush");
assert.equal(evaluateJacksOrBetter([card("9"), card("10"), card("J"), card("Q"), card("K")]).multiplier, 50);
assert.equal(evaluateJacksOrBetter([card("J"), card("J", "hearts"), card("4"), card("8"), card("2")]).multiplier, 1);
assert.equal(evaluateJacksOrBetter([card("10"), card("10", "hearts"), card("4"), card("8"), card("2")]).multiplier, 0);
assert.equal(evaluateBonusPoker([card("A"), card("A", "hearts"), card("A", "diamonds"), card("A", "clubs"), card("9")]).name, "Four Aces");
assert.equal(evaluateBonusPoker([card("3"), card("3", "hearts"), card("3", "diamonds"), card("3", "clubs"), card("9")]).multiplier, 40);
assert.equal(evaluateBonusPoker([card("K"), card("K", "hearts"), card("K", "diamonds"), card("K", "clubs"), card("9")]).multiplier, 25);
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

let drawRefresh = createVideoPokerState(10);
drawRefresh.deck = [
  card("J"), card("J", "hearts"), card("4"), card("8"), card("2"),
  card("A"), card("K"), card("Q"),
  ...Array.from({ length: 44 }, () => card("3", "clubs"))
];
drawRefresh = dealVideoPoker(drawRefresh, 0.05, 1).state;
drawRefresh.held = [true, true, false, false, false];
const refreshed = drawVideoPoker(drawRefresh);
assert.deepEqual(refreshed.state.hand.map((drawn) => drawn.rank), ["J", "J", "A", "K", "Q"]);

let pokerMarathon = createVideoPokerState(100);
for (let round = 0; round < 30; round += 1) {
  const dealt = dealVideoPoker(pokerMarathon, 0.25, 1);
  assert.equal(dealt.event.type, "pokerDealt");
  pokerMarathon = dealt.state;
  pokerMarathon.held = [false, false, false, false, false];
  const drawn = drawVideoPoker(pokerMarathon);
  assert.equal(drawn.event.type, "pokerDrawn");
  assert.equal(drawn.state.hand.length, 5);
  assert.equal(drawn.state.hand.every(Boolean), true);
  assert.equal(drawn.state.deck.length, 0);
  pokerMarathon = drawn.state;
}

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

blackjack = createBlackjackState(1000);
blackjack.deck = shoe([
  card("8"), card("8", "hearts"), card("10"), card("6"),
  card("3"), card("2"), card("K")
]);
let split = startBlackjackHand(blackjack, 100);
split = blackjackPlayerAction(split.state, "split");
assert.equal(split.state.bankroll, 800);
assert.equal(split.state.splitHands.length, 2);
assert.equal(split.state.activeHandIndex, 0);
split = blackjackPlayerAction(split.state, "stand");
assert.equal(split.state.activeHandIndex, 1);
split = blackjackPlayerAction(split.state, "stand");
assert.equal(split.state.status, "complete");
assert.equal(split.state.handsPlayed, 2);
assert.equal(split.state.wins, 2);
assert.equal(split.state.bankroll, 1200);

let ultimateX = createUltimateXState(1000);
ultimateX.deck = [
  card("2"), card("9"), card("9", "hearts"), card("9", "diamonds"), card("9", "clubs"),
  ...Array.from({ length: 47 }, () => card("3", "clubs"))
];
ultimateX = dealUltimateX(ultimateX, 25).state;
const ultimateResult = drawUltimateX(ultimateX);
assert.equal(ultimateResult.state.lastPayout, 375);
assert.equal(ultimateResult.state.nextMultiplier, 1);

let bonusPoker = createBonusPokerState(1000);
bonusPoker.deck = [
  card("A"), card("A", "hearts"), card("A", "diamonds"), card("A", "clubs"), card("9"),
  ...Array.from({ length: 47 }, () => card("3", "clubs"))
];
bonusPoker = dealBonusPoker(bonusPoker, 1).state;
bonusPoker.held = [true, true, true, true, true];
const bonusResult = drawBonusPoker(bonusPoker);
assert.equal(bonusResult.state.lastPayout, 80);
assert.equal(bonusResult.state.bestHand.name, "Four Aces");

console.log("Casino card-game tests passed");
