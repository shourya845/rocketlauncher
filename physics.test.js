import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, advance, autopilot } from './physics.js';
const rewards = { landing: 100, fuel: .3, time: .1 };
test('scripted pilot completes a safe landing', () => {
  let s = { ...initialState(), status: 'flying' };
  for (let i = 0; i < 7201 && s.status === 'flying'; i++) s = advance(s, autopilot(s), 1 / 60, rewards);
  assert.equal(s.status, 'landed'); assert.ok(s.fuel >= 0);
});
test('unpowered descent crashes and empty fuel cannot provide thrust', () => {
  let s = { ...initialState(), status: 'flying', fuel: 0 };
  s = advance(s, { main: true }, 1 / 60, rewards); assert.equal(s.thrust, false);
  for (let i = 0; i < 1000 && s.status === 'flying'; i++) s = advance(s, {}, 1 / 60, rewards);
  assert.equal(s.status, 'crashed');
});
