# Rocket Launcher

Run `npm install` once, then `npm start` and open http://localhost:3000. Run `npm test` for physics checks.

The Three.js 3D scene is served locally; no build step is required. Drag the scene to orbit, scroll or pinch to zoom, and use Overview, Follow rocket, or Top down to reset the camera. Camera presets also work with keyboard focus and Enter. WebGL2 and browser hardware acceleration are required.

The sunset test facility is inspired by the user's video: a white rocket with gold trim, a checker band and landing legs, illuminated circular pad, hangars, mountains, engine flames and touchdown dust. The scene is interactive geometry rather than prerecorded footage. Physics meters are scaled uniformly into scene units; the model and facility are illustrative, not dimensionally calibrated hardware.

Select Manual flight and use the arrow keys or touch controls. Autopilot is a fixed feedback controller, not a trained AI. Reward sliders affect scoring, not pilot behavior. Flight still uses simplified planar physics (horizontal and vertical movement), visualized in 3D, rather than a full six-axis dynamics engine or Gymnasium's LunarLander. Fonts load from Google Fonts with local fallbacks. Flight history lasts for the current page session.

The controller occupies its own dock below the 3D viewport so it cannot cover the rocket or landing pad. Scores appear in the in-game badge and in a native dialog at the end of a flight. The dialog includes landing advice and Fly again, which preserves pilot mode and reward settings. Close or Escape returns to the completed flight.


The Top 5 pilots leaderboard stores the five highest registered player scores in browser localStorage (one best result per name, case-insensitive). The result popup offers opt-in score registration; Fly again skips it. Scores are local to this browser and site address, not shared across players' devices. Name length and stored records are validated, names render as text, and storage failures show a retry message. Pilot mode is labeled; custom reward values affect comparability. Test rankings, duplicate names, invalid data and storage roundtrips with npm test.


Leaderboard eligibility: only fully manual attempts qualify. Starting with autopilot or switching to it during a flight makes that attempt ineligible, even if the player switches back. Existing saved autopilot entries are excluded from rankings. Autopilot still displays an unsaved practice score in the result dialog.


## Deploy on Vercel
Select Other as the application/framework preset and keep the root directory as ./ . The tracked vercel.json sets the build command to npm run build and the output directory to dist. Use npm install for the install command if an override is needed. No environment variables are required. The build copies only public app files and the required Three.js modules; the local preview server is not deployed. Leaderboards remain browser-local on the deployed domain.

