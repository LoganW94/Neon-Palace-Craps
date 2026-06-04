import assert from "node:assert/strict";
import { clearWorkingBets, createInitialState, placeBet, pullNumberBets, resolveRoll } from "../shared/craps-engine.mjs";

function testPassLineComeOutWin() {
  let state = createInitialState("casino", 1000);
  state = placeBet(state, { type: "passLine", amount: 10 }).state;
  const result = resolveRoll(state, { die1: 3, die2: 4, total: 7, hard: false });
  assert.equal(result.state.bankroll, 1000);
  assert.equal(result.state.bets.find((bet) => bet.type === "passLine")?.amount, 10);
  assert.match(result.event.dealerCall, /Winner front line/);
}

function testPointAndSevenOutRotation() {
  let state = createInitialState("casino", 1000);
  state = placeBet(state, { type: "passLine", amount: 10 }).state;
  state = resolveRoll(state, { die1: 2, die2: 2, total: 4, hard: true }).state;
  assert.equal(state.point, 4);
  const result = resolveRoll(state, { die1: 4, die2: 3, total: 7, hard: false });
  assert.equal(result.state.point, null);
  assert.equal(result.state.shooterIndex, 1);
  assert.equal(result.state.session.sevenOuts, 1);
}

function testPlaceSixPaysSevenToSixAndStaysWorking() {
  let state = createInitialState("casino", 1000);
  state = resolveRoll(state, { die1: 2, die2: 2, total: 4, hard: true }).state;
  state = placeBet(state, { type: "place", number: 6, amount: 60 }).state;
  const result = resolveRoll(state, { die1: 3, die2: 3, total: 6, hard: true });
  assert.equal(result.state.bankroll, 1010);
  assert.equal(result.state.bets.length, 1);
}

function testHardSixWinsNineToOne() {
  let state = createInitialState("casino", 1000);
  state = resolveRoll(state, { die1: 2, die2: 2, total: 4, hard: true }).state;
  state = placeBet(state, { type: "hardways", number: "hard6", amount: 10 }).state;
  const result = resolveRoll(state, { die1: 3, die2: 3, total: 6, hard: true });
  assert.equal(result.state.bankroll, 1080);
}

function testFieldLosesOnSix() {
  let state = createInitialState("casino", 1000);
  state = placeBet(state, { type: "field", amount: 10 }).state;
  const result = resolveRoll(state, { die1: 3, die2: 3, total: 6, hard: true });
  assert.equal(result.state.bankroll, 990);
}

function testFieldWinPaysProfitAndStaysWorking() {
  let state = createInitialState("casino", 1000);
  state = placeBet(state, { type: "field", amount: 10 }).state;
  const result = resolveRoll(state, { die1: 5, die2: 4, total: 9, hard: false });
  assert.equal(result.state.bankroll, 1000);
  assert.equal(result.state.bets.find((bet) => bet.type === "field")?.amount, 10);
}

function testCenterActionWinsOnHornNumber() {
  let state = createInitialState("casino", 1000);
  state = placeBet(state, { type: "proposition", number: "centerAction", amount: 10 }).state;
  const result = resolveRoll(state, { die1: 5, die2: 6, total: 11, hard: false });
  assert.equal(result.state.bankroll, 1070);
  assert.equal(result.state.bets.some((bet) => bet.number === "centerAction"), false);
}

function testFieldSevenOutOnlyLosesOnce() {
  let state = createInitialState("casino", 1000);
  state = resolveRoll(state, { die1: 2, die2: 2, total: 4, hard: true }).state;
  state = placeBet(state, { type: "field", amount: 10 }).state;
  const result = resolveRoll(state, { die1: 4, die2: 3, total: 7, hard: false });
  assert.equal(result.state.bankroll, 990);
  assert.equal(result.event.losses.filter((loss) => loss.label === "Field").length, 1);
}

function testNumberBetsDoNotWorkOnComeOut() {
  let state = createInitialState("casino", 1000);
  state = placeBet(state, { type: "place", number: 4, amount: 10 }).state;
  let result = resolveRoll(state, { die1: 2, die2: 2, total: 4, hard: true });
  assert.equal(result.state.point, 4);
  assert.equal(result.state.bankroll, 990);
  assert.equal(result.event.payouts.length, 0);
  result = resolveRoll(result.state, { die1: 3, die2: 1, total: 4, hard: false });
  assert.equal(result.state.bankroll, 1008);
}

function testClearBetsKeepsContractBetsOnly() {
  let state = createInitialState("casino", 1000);
  state = placeBet(state, { type: "passLine", amount: 10 }).state;
  state = placeBet(state, { type: "field", amount: 10 }).state;
  const cleared = clearWorkingBets(state);
  assert.equal(cleared.bankroll, 990);
  assert.equal(cleared.bets.length, 1);
  assert.equal(cleared.bets[0].type, "passLine");
}

function testPullNumberBetsReturnsOnlyRemovableNumberChips() {
  let state = createInitialState("casino", 1000);
  state = placeBet(state, { type: "place", number: 6, amount: 25 }).state;
  state = placeBet(state, { type: "come", number: 6, amount: 25 }).state;
  const result = pullNumberBets(state, 6);
  assert.equal(result.state.bankroll, 975);
  assert.equal(result.state.bets.length, 1);
  assert.equal(result.state.bets[0].type, "come");
}

function testPassOddsPayTrueOddsOnPointMade() {
  let state = createInitialState("casino", 1000);
  state = placeBet(state, { type: "passLine", amount: 10 }).state;
  state = resolveRoll(state, { die1: 2, die2: 2, total: 4, hard: true }).state;
  state = placeBet(state, { type: "odds", parentType: "passLine", number: 4, amount: 10 }).state;
  const result = resolveRoll(state, { die1: 3, die2: 1, total: 4, hard: false });
  assert.equal(result.state.bankroll, 1020);
  assert.equal(result.event.payouts.find((payout) => payout.label === "Odds 4")?.profit, 20);
}

function testDontPassOddsPayOnSevenOut() {
  let state = createInitialState("casino", 1000);
  state = placeBet(state, { type: "dontPass", amount: 10 }).state;
  state = resolveRoll(state, { die1: 2, die2: 2, total: 4, hard: true }).state;
  state = placeBet(state, { type: "odds", parentType: "dontPass", number: 4, amount: 20 }).state;
  const result = resolveRoll(state, { die1: 4, die2: 3, total: 7, hard: false });
  assert.equal(result.state.bankroll, 1020);
  assert.equal(result.event.payouts.find((payout) => payout.label === "Odds 4")?.profit, 10);
}

function testDontPassOddsLoseWhenPointMade() {
  let state = createInitialState("casino", 1000);
  state = placeBet(state, { type: "dontPass", amount: 10 }).state;
  state = resolveRoll(state, { die1: 2, die2: 2, total: 4, hard: true }).state;
  state = placeBet(state, { type: "odds", parentType: "dontPass", number: 4, amount: 20 }).state;
  const result = resolveRoll(state, { die1: 3, die2: 1, total: 4, hard: false });
  assert.equal(result.state.bankroll, 970);
  assert.equal(result.event.losses.filter((loss) => loss.label === "Odds 4").length, 1);
}

function testOddsRejectWithoutFlatPointBet() {
  const state = createInitialState("casino", 1000);
  const result = placeBet(state, { type: "odds", parentType: "passLine", amount: 10 });
  assert.equal(result.event.type, "rejected");
}

function testComeBetTravelsWithoutSameRollWin() {
  let state = createInitialState("casino", 1000);
  state = resolveRoll(state, { die1: 2, die2: 2, total: 4, hard: true }).state;
  state = placeBet(state, { type: "come", amount: 10 }).state;
  const result = resolveRoll(state, { die1: 3, die2: 3, total: 6, hard: true });
  assert.equal(result.state.bankroll, 990);
  assert.equal(result.state.bets.find((bet) => bet.type === "come")?.number, 6);
}

function testCraplessTwoBecomesPoint() {
  let state = createInitialState("crapless", 1000);
  state = placeBet(state, { type: "passLine", amount: 10 }).state;
  const result = resolveRoll(state, { die1: 1, die2: 1, total: 2, hard: true });
  assert.equal(result.state.point, 2);
  assert.equal(result.state.bankroll, 990);
  assert.match(result.event.dealerCall, /Crapless point is 2/);
}

function testCraplessRejectsDontCome() {
  const state = createInitialState("crapless", 1000);
  const result = placeBet(state, { type: "dontCome", amount: 10 });
  assert.equal(result.event.type, "rejected");
  assert.equal(result.state.bankroll, 1000);
}

[
  testPassLineComeOutWin,
  testPointAndSevenOutRotation,
  testPlaceSixPaysSevenToSixAndStaysWorking,
  testHardSixWinsNineToOne,
  testFieldLosesOnSix,
  testFieldWinPaysProfitAndStaysWorking,
  testCenterActionWinsOnHornNumber,
  testFieldSevenOutOnlyLosesOnce,
  testNumberBetsDoNotWorkOnComeOut,
  testClearBetsKeepsContractBetsOnly,
  testPullNumberBetsReturnsOnlyRemovableNumberChips,
  testPassOddsPayTrueOddsOnPointMade,
  testDontPassOddsPayOnSevenOut,
  testDontPassOddsLoseWhenPointMade,
  testOddsRejectWithoutFlatPointBet,
  testComeBetTravelsWithoutSameRollWin,
  testCraplessTwoBecomesPoint,
  testCraplessRejectsDontCome
].forEach((test) => test());

console.log("Craps engine tests passed");
