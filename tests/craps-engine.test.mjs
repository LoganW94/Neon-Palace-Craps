import assert from "node:assert/strict";
import { createInitialState, placeBet, resolveRoll } from "../shared/craps-engine.mjs";

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
  state = placeBet(state, { type: "place", number: 6, amount: 60 }).state;
  const result = resolveRoll(state, { die1: 3, die2: 3, total: 6, hard: true });
  assert.equal(result.state.bankroll, 1010);
  assert.equal(result.state.bets.length, 1);
}

function testHardSixWinsNineToOne() {
  let state = createInitialState("casino", 1000);
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

function testFieldSevenOutOnlyLosesOnce() {
  let state = createInitialState("casino", 1000);
  state = resolveRoll(state, { die1: 2, die2: 2, total: 4, hard: true }).state;
  state = placeBet(state, { type: "field", amount: 10 }).state;
  const result = resolveRoll(state, { die1: 4, die2: 3, total: 7, hard: false });
  assert.equal(result.state.bankroll, 990);
  assert.equal(result.event.losses.filter((loss) => loss.label === "Field").length, 1);
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
  testFieldSevenOutOnlyLosesOnce,
  testComeBetTravelsWithoutSameRollWin,
  testCraplessTwoBecomesPoint,
  testCraplessRejectsDontCome
].forEach((test) => test());

console.log("Craps engine tests passed");
