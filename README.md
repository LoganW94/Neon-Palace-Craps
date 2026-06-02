# Neon Palace Craps

Neon Palace Craps is a local Las Vegas-style craps simulator with an immersive felt table UI, animated dice, chip stacks, bankroll tracking, tutorial/help content, casino ambience, and a Node backend shaped for future multiplayer expansion.

The project currently runs without third-party dependencies. If you have Node installed, you can launch it directly.

## How To Launch

### macOS double-click

Double-click:

```text
Launch Neon Palace Craps.command
```

That opens the app in your browser at:

```text
http://127.0.0.1:4173
```

Keep the terminal window open while playing. Press `Control-C` in that window to stop the app.

If Chrome says `This site can't be reached` or `ERR_CONNECTION_REFUSED`, the server did not finish starting. Launch again with the updated command file and watch the terminal window for any message about Node.js, port `4173`, or `.neon-palace-server.log`.

If the launcher says `Node.js is required but was not found`, install Node from [nodejs.org](https://nodejs.org) or run the app from Codex. The macOS launcher also checks common Node locations, including the Codex app's bundled Node runtime.

### Terminal

```bash
cd "/Users/twincreektransport/Documents/test project"
./launch.sh
```

Or run the server directly:

```bash
node backend/src/server.mjs
```

### Windows

Double-click:

```text
launch.bat
```

## Gameplay Features

- Authentic come-out and point cycle handling
- Pass Line, Don't Pass, Come, Don't Come
- Pass Odds and Don't Pass Odds with true odds / lay odds behavior
- Field, Place, Buy, Lay, Hardways, Proposition, Big 6 / Big 8
- Crapless Craps mode where 2, 3, 11, and 12 establish points instead of crapping out
- Proper shooter rotation after seven-out
- Bets-off behavior for number bets on come-out rolls
- Point marker directly on the active number
- Traveled Come bet chips on number boxes
- Current bet total, bankroll, profit/loss, roll history, and streak tracking
- Clear removable bets while keeping contract bets protected
- Per-number Press, Pull, Buy, and Lay controls
- Chip stacks summarized into higher denominations instead of growing indefinitely
- More realistic Field layout with 2/12 double-pay markings
- Casino sound effects and optional ambience/music
- Practice, casino, high roller, tutorial, quick play, and crapless modes

## Controls

- Select a chip from the rack, then click a layout area to bet.
- Use `Pass Odds` or `Don't Odds` after a point is established and the matching flat bet exists.
- Hover a number box to reveal `Press`, `Pull`, `Buy`, and `Lay`.
- `Clear Removable Bets` pulls down non-contract bets and odds.
- Contract bets such as Pass Line, Don't Pass, Come, and Don't Come stay protected until resolved.

## Project Structure

```text
backend/       Node server, API routes, event bus, lobby/profile placeholders
frontend/      Browser UI, state store, casino sounds, responsive felt table
shared/        Craps rules engine and TypeScript contracts
tests/         Game-engine regression tests
docs/          Architecture notes for future React/WebSocket migration
```

## Test

```bash
node tests/craps-engine.test.mjs
```

Useful syntax checks:

```bash
node --check frontend/src/main.mjs
node --check frontend/src/state/store.mjs
node --check shared/craps-engine.mjs
```

## Configuration

The server defaults to:

```text
HOST=127.0.0.1
PORT=4173
```

Override when launching:

```bash
PORT=8080 ./launch.sh
```

## Deployment

Any Node host can run the app:

```bash
PORT=8080 NODE_ENV=production node backend/src/server.mjs
```

For a commercial deployment, add HTTPS, persistent storage, authentication, rate limiting, a WebSocket gateway, and production-grade account/session services. The backend already includes placeholder architecture for lobby tables, player profiles, event routing, spectators, chat, friends, matchmaking, and persistent profiles.
