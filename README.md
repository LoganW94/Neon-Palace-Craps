# Neon Palace Craps

A polished Las Vegas-style craps simulator with a Node backend, immersive table UI, realistic casino bet types, bankroll tracking, AI table atmosphere, tutorial screens, and multiplayer-ready architecture.

## Run Locally

```bash
node backend/src/server.mjs
```

Open [http://localhost:4173](http://localhost:4173).

This project currently runs without external dependencies because this workspace has Node but no package manager. The structure is ready to migrate to React/TypeScript with Vite or Next.js when `npm`, `pnpm`, or `yarn` is available.

## Test

```bash
node tests/craps-engine.test.mjs
```

## Included

- Authentic come-out and point cycle handling
- Pass Line, Don't Pass, Come, Don't Come
- Odds, Field, Place, Buy, Lay, Hardways, Proposition, Big 6 / Big 8
- Shooter rotation after seven-out
- True odds payout tables
- Bankroll, win/loss, roll history, streaks, charts
- Practice, casino, high roller, tutorial, and quick modes
- Crapless Craps mode where 2, 3, 11, and 12 establish points instead of crapping out
- Dealer callouts, dice animation, chip stacks, generated casino sounds
- Number-box point marker plus traveled Come bet chips
- AI player personalities and strategy assistant
- Future lobby, profiles, chat, spectator, matchmaking, and persistence contracts

## Deployment

Any Node host can run the app:

```bash
PORT=8080 NODE_ENV=production node backend/src/server.mjs
```

For a commercial deployment, put the Node server behind HTTPS, add persistent storage, replace the in-memory lobby/profile services, and enable a WebSocket gateway using the event contracts in `backend/src/models/multiplayerContracts.mjs`.
