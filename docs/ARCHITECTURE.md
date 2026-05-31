# Architecture Notes

Neon Palace is currently shipped as a no-build Node-served SPA so it runs on machines that only have Node installed. The source layout intentionally mirrors a React/TypeScript application:

- `frontend/src/components`: future React component home for table zones, rails, charts, and dialogs.
- `frontend/src/state`: client store and view state.
- `frontend/src/services`: browser-side API, sound, replay, and later socket services.
- `shared`: game math and TypeScript contracts shared by frontend and backend.
- `backend/src/api`: HTTP endpoints.
- `backend/src/events`: event bus abstraction that can be swapped for WebSockets.
- `backend/src/multiplayer`: lobby, table, matchmaking, spectator, and social services.
- `backend/src/models`: account and multiplayer contracts.

## React Upgrade Path

The DOM renderer in `frontend/src/main.mjs` can be replaced component-by-component with React without changing the game engine. Recommended migration:

1. Add Vite or Next.js once a package manager is available.
2. Move render helpers into `frontend/src/components/*.tsx`.
3. Wrap `Store` in React context or Zustand.
4. Keep `shared/craps-engine.mjs` as the deterministic domain layer.
5. Introduce a WebSocket gateway that emits the same events already named in `MultiplayerContracts`.

## Multiplayer Roadmap

The backend is already shaped around event messages:

- `table.join`
- `bet.place`
- `dice.roll`
- `dealer.call`
- `chat.message`
- `spectator.join`
- `profile.update`

Future production services should add authentication, anti-collusion monitoring, replay logs, rate limiting, persistent profiles, and isolated table rooms.
