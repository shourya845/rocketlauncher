# Rocket Launcher

A 3D browser game where you guide a rocket back to its landing pad. Balance thrust, tilt, fuel, and time to stick the landing — preferably without turning the test range into a fireworks show.

## Features

- Interactive Three.js sunset launch facility with orbit, follow, and top-down camera views
- Manual flight controls for keyboard and touch
- Scripted autopilot mode for practice and demonstration
- Adjustable landing, fuel, and time reward values
- End-of-flight score, landing advice, and replay flow
- Local Top 5 leaderboard for fully manual flights only
- Static Vercel-ready build with no environment variables required

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Controls

| Action | Keyboard | Touch / on-screen control |
| --- | --- | --- |
| Tilt left | Left arrow | Left button |
| Thrust | Up arrow | Thrust button |
| Tilt right | Right arrow | Right button |
| Move camera | Drag scene | Drag scene |
| Zoom camera | Mouse wheel | Pinch |

Choose **Manual flight** to pilot the rocket yourself, or **Autopilot** to watch the scripted landing controller. The autopilot is a demo controller, not a trained AI model.

## Scoring and leaderboard

Landing rewards, fuel penalties, and time penalties can be adjusted in the game. The result dialog shows the score and tells the player what to improve for the next landing.

Only flights completed entirely in **Manual flight** can be registered on the Top 5 leaderboard. Any flight that starts in autopilot or switches to it is shown as practice only. Scores are saved in the browser's local storage, so they stay on that browser and site address; they are not shared online.

## Development

```bash
npm test
npm run build
```

`npm test` checks the flight physics and leaderboard rules. `npm run build` produces the deployable static files in `dist/`.

## Deploy to Vercel

Import this repository into Vercel and use these settings:

- Framework preset: **Other**
- Root directory: `./`
- Build command: `npm run build`
- Output directory: `dist`

The included `vercel.json` already configures the build, and no environment variables are needed.

## Project structure

| File | Purpose |
| --- | --- |
| `app.js` | Game interface, controls, scoring, and result dialog |
| `physics.js` | Simplified rocket-flight simulation and autopilot logic |
| `scene3d.js` | Three.js rocket, landing pad, and test-range scene |
| `leaderboard.js` | Manual-flight score validation and Top 5 ranking |
| `build.js` | Static deployment build |

## Notes

The simulation uses simplified two-dimensional flight physics presented in a 3D scene. It is designed as a playful landing challenge, not as a real rocket-flight simulator.
