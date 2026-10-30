export const initialState = () => ({ x: -85, y: 240, vx: 8, vy: -5, angle: 0, fuel: 100, time: 0, score: 0, status: 'ready', thrust: false });
export function advance(s, action, dt, rewards) {
  if (s.status !== 'flying') return s;
  const n = { ...s, time: s.time + dt };
  const powered = s.fuel > 0;
  n.angle += (action.left ? -1 : 0) * dt * 1.2 + (action.right ? 1 : 0) * dt * 1.2;
  n.thrust = !!action.main && powered;
  if (n.thrust) { n.vx += Math.sin(n.angle) * 19 * dt; n.vy += Math.cos(n.angle) * 19 * dt; n.fuel = Math.max(0, s.fuel - 4 * dt); }
  n.vy -= 7 * dt;
  n.x += n.vx * dt; n.y += n.vy * dt;
  const potential = v => -Math.hypot(v.x, v.y) * .12 - Math.hypot(v.vx, v.vy) * .6 - Math.abs(v.angle) * 10;
  n.score += potential(n) - potential(s) - rewards.time * dt - (n.thrust ? rewards.fuel * dt : 0);
  if (n.y <= 0) {
    n.y = 0; n.thrust = false;
    n.status = Math.abs(n.x) < 27 && Math.abs(n.vx) < 5 && Math.abs(n.vy) < 7 && Math.abs(n.angle) < .2 ? 'landed' : 'crashed';
    n.score += n.status === 'landed' ? rewards.landing : -100;
  } else if (Math.abs(n.x) > 340 || n.y > 450 || n.time > 120) { n.status = 'crashed'; n.score -= 100; n.thrust = false; }
  return n;
}
// shortcut: a feedback controller demonstrates landing; replace with a trained policy for real reinforcement learning.
export function autopilot(s) {
  const desiredAngle = Math.max(-.32, Math.min(.32, (-s.x * .025 - s.vx * .55) * .08));
  const desiredSpeed = -Math.min(20, Math.max(2, s.y * .15));
  return { left: s.angle > desiredAngle + .015, right: s.angle < desiredAngle - .015, main: s.vy < desiredSpeed };
}
