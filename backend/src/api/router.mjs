import { createInitialState, multiplayerBlueprint, resolveRoll, rollDice } from "../../../shared/craps-engine.mjs";
import { MultiplayerContracts } from "../models/multiplayerContracts.mjs";

export async function routeApi({ request, response, lobbyService, profileService, eventBus }) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "GET" && url.pathname === "/api/health") {
    return sendJson(response, { ok: true, service: "vegas-craps-simulator" });
  }

  if (request.method === "GET" && url.pathname === "/api/lobby/tables") {
    return sendJson(response, { tables: lobbyService.listTables() });
  }

  if (request.method === "GET" && url.pathname === "/api/multiplayer/blueprint") {
    return sendJson(response, { contracts: MultiplayerContracts, blueprint: multiplayerBlueprint() });
  }

  if (request.method === "GET" && url.pathname === "/api/profile/me") {
    return sendJson(response, { profile: profileService.getGuestProfile() });
  }

  if (request.method === "POST" && url.pathname === "/api/simulate/roll") {
    const body = await readJson(request);
    const state = body.state ?? createInitialState("casino");
    const result = resolveRoll(state, rollDice());
    eventBus.emit("dice.rolled", result.event);
    return sendJson(response, result);
  }

  return false;
}

export function sendJson(response, payload, statusCode = 200) {
  const body = JSON.stringify(payload, null, 2);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(body);
  return true;
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
