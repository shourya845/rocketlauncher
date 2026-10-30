export const SCORE_KEY = 'rocket-launcher.scores.v1';

export function topPlayers(entries) {
  if (!Array.isArray(entries)) throw new Error('Saved scores are not a list.');
  const players = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry.name !== 'string' || !entry.name.trim() || entry.name.trim().length > 24 || /[\u0000-\u001f\u007f]/.test(entry.name) || !Number.isFinite(entry.score) || entry.mode !== 'manual' || !['landed', 'crashed'].includes(entry.outcome)) continue;
    const name = entry.name.trim().normalize('NFC');
    const key = name.toLowerCase();
    const previous = players.get(key);
    if (!previous || entry.score > previous.score) players.set(key, { name, score: entry.score, mode: entry.mode, outcome: entry.outcome });
  }
  return [...players.values()].sort((a, b) => b.score - a.score).slice(0, 5);
}

export function registerScore(entries, entry) {
  if (entry.mode !== 'manual') throw new Error('Only fully manual flights qualify for the leaderboard.');
  const name = typeof entry.name === 'string' ? entry.name.trim().normalize('NFC') : '';
  if (!name || name.length > 24 || /[\u0000-\u001f\u007f]/.test(name)) throw new Error('Enter a player name between 1 and 24 characters.');
  if (!Number.isFinite(entry.score) || !['auto', 'manual'].includes(entry.mode) || !['landed', 'crashed'].includes(entry.outcome)) throw new Error('Complete a flight before registering a score.');
  return topPlayers([...entries, { ...entry, name }]);
}
