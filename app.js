import { initialState, advance, autopilot } from './physics.js';
import { SCORE_KEY, topPlayers, registerScore } from './leaderboard.js';
const $ = id => document.getElementById(id);
const canvas = $('scene');
let flightScene;
try {
  const { createFlightScene } = await import('./scene3d.js');
  flightScene = createFlightScene(canvas);
} catch (error) {
  $('scene-error').hidden = false;
  console.error('Unable to initialize 3D rendering:', error);
}
let state = initialState(), mode = 'auto', paused = false, flights = 0, recorded = false, last = 0, accumulator = 0;
let finishedFlight = null, scoreRegistered = false, usedAutopilot = false;
function renderLeaderboard() {
  const body = $('leaderboard-rows');
  body.replaceChildren();
  try {
    const players = topPlayers(JSON.parse(localStorage.getItem(SCORE_KEY) || '[]'));
    $('leaderboard-empty').hidden = players.length > 0;
    $('leaderboard-table').hidden = players.length === 0;
    $('leaderboard-status').textContent = '';
    players.forEach((player, index) => {
      const row = document.createElement('tr');
      for (const value of [String(index + 1).padStart(2, '0'), player.name, player.mode === 'manual' ? 'Manual' : 'Autopilot', player.score.toFixed(1)]) {
        const cell = document.createElement('td');
        cell.textContent = value; row.append(cell);
      }
      body.append(row);
    });
  } catch {
    $('leaderboard-table').hidden = true;
    $('leaderboard-empty').hidden = true;
    $('leaderboard-status').textContent = 'Saved scores could not be read. Check browser storage access and reload.';
  }
}
$('show-registration').onclick = () => {
  $('score-registration').hidden = false;
  $('show-registration').hidden = true;
  $('player-name').focus();
};
$('score-registration').onsubmit = event => {
  event.preventDefault();
  if (!finishedFlight || finishedFlight.mode !== 'manual' || scoreRegistered) return;
  try {
    const name = $('player-name').value.trim().normalize('NFC');
    const previous = topPlayers(JSON.parse(localStorage.getItem(SCORE_KEY) || '[]'));
    const players = registerScore(previous, { ...finishedFlight, name });
    localStorage.setItem(SCORE_KEY, JSON.stringify(players));
    scoreRegistered = true;
    $('score-registration').hidden = true;
    const rank = players.findIndex(player => player.name.toLowerCase() === name.toLowerCase());
    $('registration-status').textContent = rank < 0 ? 'Score checked! It did not reach the top five this time. Fly again and aim higher.' : players[rank].score > finishedFlight.score ? `Your best score is still ${players[rank].score.toFixed(1)} points. You are #${rank + 1} on this browser.` : `Score registered! You are #${rank + 1} on this browser.`;
    renderLeaderboard();
    $('fly-again').focus();
  } catch (error) {
    $('registration-status').textContent = error.message.startsWith('Enter a player name') ? error.message : 'Could not save your score. Check browser storage access and try again.';
  }
};
window.addEventListener('storage', event => { if (event.key === SCORE_KEY || event.key === null) renderLeaderboard(); });
renderLeaderboard();
const keys = new Set();
for (const button of document.querySelectorAll('[data-view]')) {
  button.disabled = !flightScene;
  button.onclick = () => {
    flightScene.setView(button.dataset.view);
    for (const option of document.querySelectorAll('[data-view]')) option.setAttribute('aria-pressed', String(option === button));
  };
}
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  paused = true;
  flightScene = null;
  $('scene-error').hidden = false;
  update();
});
const rewards = () => ({ landing: +$('landing').value, fuel: +$('fuel-cost').value, time: +$('time-cost').value });
function announce(message) { $('announcement').textContent = message; }
function setMode(next) { if (next === 'auto' && state.status === 'flying') usedAutopilot = true; mode = next; for (const id of ['auto', 'manual']) { $(id).classList.toggle('selected', id === next); $(id).setAttribute('aria-pressed', id === next); } $('mode-description').textContent = next === 'auto' ? 'Sit back and watch a scripted pilot find its way to the pad.' : 'Use ↑ for thrust and ← / → to rotate. Touch controls work too.'; }
$('auto').onclick = () => setMode('auto'); $('manual').onclick = () => setMode('manual');
function reset() { if ($('flight-result').open) $('flight-result').close(); finishedFlight = null; usedAutopilot = false; state = initialState(); paused = false; recorded = false; keys.clear(); accumulator = 0; $('pause').textContent = 'Pause'; update(); }
$('launch').onclick = () => { if (state.status !== 'ready') reset(); state.status = 'flying'; usedAutopilot = mode === 'auto'; paused = false; update(); announce('Flight launched.'); };
$('reset').onclick = reset;
$('fly-again').onclick = () => { reset(); $('launch').click(); };
$('pause').onclick = () => { paused = !paused; keys.clear(); $('pause').textContent = paused ? 'Resume' : 'Pause'; update(); };
for (const name of ['landing', 'fuel-cost', 'time-cost']) $(name).oninput = () => { $(`${name}-value`).textContent = name === 'landing' ? `+${$(name).value}` : `−${Number($(name).value).toFixed(1)} / s`; };
$('defaults').onclick = () => { for (const [id, value] of [['landing', 100], ['fuel-cost', .3], ['time-cost', .1]]) { $(id).value = value; $(id).oninput(); } };
window.addEventListener('keydown', e => { if (!['ArrowLeft','ArrowRight','ArrowUp'].includes(e.key) || /INPUT/.test(e.target.tagName)) return; e.preventDefault(); if (state.status === 'flying' && !paused && mode === 'manual') keys.add(e.key); });
window.addEventListener('keyup', e => keys.delete(e.key));
window.addEventListener('blur', () => keys.clear());
document.addEventListener('visibilitychange', () => { last = 0; keys.clear(); });
for (const button of document.querySelectorAll('[data-key]')) { button.onpointerdown = e => { e.preventDefault(); button.setPointerCapture(e.pointerId); if (mode === 'manual') keys.add(button.dataset.key); }; for (const event of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(event, () => keys.delete(button.dataset.key)); }
function update() {
  $('altitude').innerHTML = `${Math.round(state.y)}<small>m</small>`; $('speed').innerHTML = `${state.vy.toFixed(1)}<small>m/s</small>`; $('fuel').innerHTML = `${Math.round(state.fuel)}<small>%</small>`;
  $('time').textContent = `${String(Math.floor(state.time / 60)).padStart(2,'0')}:${String(Math.floor(state.time % 60)).padStart(2,'0')}`; $('score').textContent = state.score.toFixed(1); $('live-score').textContent = state.score.toFixed(1);
  $('pause').disabled = state.status !== 'flying' || !flightScene; $('launch').disabled = state.status === 'flying' || !flightScene; $('launch').style.opacity = $('launch').disabled ? '.55' : '1';
  const ended = ['landed','crashed'].includes(state.status);
  if (ended && !recorded) {
    flights++; recorded = true; keys.clear(); $('attempts').textContent = flights;
    const landed = state.status === 'landed';
    finishedFlight = { score: Number(state.score.toFixed(1)), mode: usedAutopilot ? 'auto' : 'manual', outcome: state.status };
    scoreRegistered = false;
    $('score-registration').hidden = true;
    $('show-registration').hidden = usedAutopilot;
    $('register-question').textContent = usedAutopilot ? 'Manual pilots only!' : 'Would you like to register your score?';
    $('registration-description').textContent = usedAutopilot ? 'Autopilot was used in this flight, so this score cannot enter the leaderboard. Fly the whole attempt manually to qualify.' : 'Add your name to this browser’s top-five leaderboard.';
    $('registration-status').textContent = '';
    $('flight-result').dataset.outcome = state.status;
    $('finish-title').textContent = landed ? 'You stuck the landing!' : 'One more try?';
    $('finish-message').textContent = landed ? 'Soft touchdown. Ready to land again? Try manual flight for your next challenge.' : 'Aim for the center of the pad, keep the rocket upright, and use short bursts of thrust to slow your descent. Ready to try again?';
    $('finish-score').textContent = state.score.toFixed(1);
    $('finish-time').textContent = `${state.time.toFixed(1)} s`;
    $('finish-fuel').textContent = `${Math.round(state.fuel)}%`;
    $('finish-flight').textContent = `FLIGHT ${String(flights).padStart(3, '0')} COMPLETE`;
    $('flight-result').showModal();
    announce(landed ? 'Safe landing! Your score is ready. Fly again?' : 'Flight ended. Your score and landing tips are ready.');
  }
  $('mission').textContent = `FLIGHT ${String(flights + (ended ? 0 : 1)).padStart(3,'0')}`;
  $('phase').textContent = paused ? 'FLIGHT PAUSED' : ({ready:'READY WHEN YOU ARE',flying:mode === 'auto' ? 'SCRIPTED AUTOPILOT ENGAGED' : 'YOU HAVE THE CONTROLS',landed:'TOUCHDOWN CONFIRMED',crashed:'FLIGHT ENDED'})[state.status];
  $('headline').textContent = paused ? 'Take a breath.' : ({ready:'Your next flight awaits.',flying:'Bring it home.',landed:'A soft landing.',crashed:'Gravity wins this round.'})[state.status];
  $('message').textContent = ({ready:'Engage the autopilot, or take the controls yourself.',flying:'Aim for the pad. Keep your descent slow and steady.',landed:'Upright, on target, and back on solid ground.',crashed:'Try a slower descent and keep the rocket upright.'})[state.status];
  $('result-title').textContent = ended ? (state.status === 'landed' ? 'Welcome back to solid ground.' : 'There is always another flight.') : 'Every flight tells a story.';
  $('result-copy').textContent = ended ? `Flight ${flights} · ${state.time.toFixed(1)} seconds · ${(100-state.fuel).toFixed(1)}% fuel used · ${state.score.toFixed(1)} points` : 'Land gently, stay upright, and make every drop of fuel count.';
}
function draw() { flightScene?.render(state); }
function frame(now) { const dt = last ? Math.min((now-last)/1000,.1) : 0; last=now; if(state.status==='flying'&&!paused){accumulator+=dt;while(accumulator>=1/60){state=advance(state,mode==='auto'?autopilot(state):{left:keys.has('ArrowLeft'),right:keys.has('ArrowRight'),main:keys.has('ArrowUp')},1/60,rewards());accumulator-=1/60;}update();}draw();requestAnimationFrame(frame); }
update();requestAnimationFrame(frame);
