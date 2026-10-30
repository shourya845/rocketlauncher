import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topPlayers, registerScore } from './leaderboard.js';
const entry = (name, score) => ({ name, score, mode: 'manual', outcome: 'landed' });

test('ranks the best five distinct players, highest score first', () => {
  const players = topPlayers([entry('Ada', 10), entry('Bo', 30), entry('Cy', 20), entry('Dee', 50), entry('Eve', 40), entry('Fox', 60)]);
  assert.deepEqual(players.map(p => p.name), ['Fox', 'Dee', 'Eve', 'Bo', 'Cy']);
});
test('keeps a player’s best score, ignoring spaces and name case', () => {
  let players = registerScore([entry('Ada', 100)], entry(' ada ', 20));
  assert.equal(players.length, 1); assert.equal(players[0].score, 100);
  players = registerScore(players, entry('ADA', 120));
  assert.equal(players.length, 1); assert.equal(players[0].score, 120);
});
test('validates saved data and rejects invalid registrations', () => {
  assert.deepEqual(topPlayers([null, entry('Bad', Infinity), entry('', 10), {name:'X', score:1}, entry('Valid', -30)]), [entry('Valid', -30)]);
  assert.throws(() => registerScore([], entry('   ', 10)), /player name/);
  assert.throws(() => registerScore([], entry('A'.repeat(25), 10)), /player name/);
  assert.throws(() => registerScore([], entry('Ada', NaN)), /Complete a flight/);
  assert.throws(() => topPlayers({}), /not a list/);
});
test('roundtrips stored scores and preserves existing players on equal scores', () => {
  const existing = [entry('Ada', 50), entry('Bo', 50)];
  assert.deepEqual(topPlayers(JSON.parse(JSON.stringify(existing))), existing);
  assert.deepEqual(registerScore(existing, entry('Cy', 50)).map(p => p.name), ['Ada','Bo','Cy']);
});
test('excludes saved autopilot scores and rejects new autopilot submissions', () => {
  const auto = { ...entry('Auto Pilot', 999), mode: 'auto' };
  assert.deepEqual(topPlayers([auto, entry('Manual Pilot', 50)]), [entry('Manual Pilot', 50)]);
  assert.throws(() => registerScore([], auto), /fully manual/);
});
