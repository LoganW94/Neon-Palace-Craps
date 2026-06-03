# Neon Palace Casino

Neon Palace Casino is a local Vegas-inspired casino game floor with immersive craps, Jacks or Better video poker, Deuces Wild Ultimate X, blackjack with a live player guide, bankroll tracking, casino ambience, and a Node backend shaped for future multiplayer expansion.

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

## Casino Games

- Main menu reworked as a casino floor with Craps, Jacks or Better, Deuces Wild Ultimate X, Blackjack, Settings, Stats, and unavailable Multiplayer.
- Shared chip selection across games.
- Poker machines use credit denominations starting at 5 cents.
- Jacks or Better and Deuces Wild Ultimate X support 1 to 10 hands per deal.
- Card-specific sound effects for dealing, drawing, holds, wins, and losses.
- Softer animated card entry for video poker and blackjack hands, with held poker cards pulled down slightly.
- Neon Palace blue/gold/cyan/coral visual theme across table games and card machines.
- Bankroll and profit/loss tracking per game surface.

## Craps Features

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

## Video Poker

- Jacks or Better five-card draw.
- Hold and draw controls.
- 1 to 10 hand play using the same held cards.
- Credit denominations from 5 cents upward.
- Full-pay style paytable display.
- Hand evaluation for royal flush, straight flush, four of a kind, full house, flush, straight, trips, two pair, and Jacks or Better.
- Session stats for hands played, last payout, and best hand.

## Deuces Wild Ultimate X

- Deuces are wild.
- Separate Ultimate X bankroll and machine screen.
- 1 to 10 hand play with per-hand multiplier results.
- Active multiplier applies to the current draw payout.
- Winning hands award a multiplier for the next hand.
- Deuces Wild paytable includes natural royal, four deuces, wild royal, five of a kind, straight flush, four of a kind, full house, flush, straight, and trips.

## Blackjack

- Dealer stands on soft 17.
- Blackjack pays 3:2.
- Hit, stand, and double controls.
- Player guide with odds, house-edge context, and recommended plays based on current hand and dealer up-card.
- Session tracking for wins, losses, and pushes.

## Controls

- Select a chip from the rack, then click a layout area to bet.
- Use `Pass Odds` or `Don't Odds` after a point is established and the matching flat bet exists.
- Hover a number box to reveal `Press`, `Pull`, `Buy`, and `Lay`.
- `Clear Removable Bets` pulls down non-contract bets and odds.
- Contract bets such as Pass Line, Don't Pass, Come, and Don't Come stay protected until resolved.

## Project Structure

```text
backend/       Node server, API routes, event bus, lobby/profile placeholders
frontend/      Browser UI, state store, casino sounds, responsive game screens
shared/        Craps engine, card-game engine, and TypeScript contracts
tests/         Game-engine regression tests
docs/          Architecture notes for future React/WebSocket migration
```

## Test

```bash
npm test
```

Useful syntax checks:

```bash
node --check frontend/src/main.mjs
node --check frontend/src/state/store.mjs
node --check shared/craps-engine.mjs
node --check shared/casino-games.mjs
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
