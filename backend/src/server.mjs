import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { routeApi, sendJson } from "./api/router.mjs";
import { EventBus } from "./events/eventBus.mjs";
import { LobbyService } from "./multiplayer/lobbyService.mjs";
import { ProfileService } from "./services/profileService.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = normalize(join(__dirname, "../.."));
const publicRoot = join(root, "frontend");
const sharedRoot = join(root, "shared");
const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? "127.0.0.1";
const eventBus = new EventBus();
const lobbyService = new LobbyService(eventBus);
const profileService = new ProfileService();

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav"
};

const server = http.createServer(async (request, response) => {
  try {
    if (request.url.startsWith("/api/")) {
      const handled = await routeApi({ request, response, lobbyService, profileService, eventBus });
      if (!handled) sendJson(response, { error: "Not found" }, 404);
      return;
    }
    serveStatic(request, response);
  } catch (error) {
    sendJson(response, { error: error.message }, 500);
  }
});

server.listen(port, host, () => {
  console.log(`Vegas craps simulator running at http://${host}:${port}`);
});

function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname.startsWith("/shared/")) {
    const sharedPath = normalize(join(sharedRoot, decodeURIComponent(url.pathname.replace("/shared/", ""))));
    if (!sharedPath.startsWith(sharedRoot) || !existsSync(sharedPath) || !statSync(sharedPath).isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": mime[extname(sharedPath)] ?? "text/plain; charset=utf-8", "Cache-Control": "no-store" });
    createReadStream(sharedPath).pipe(response);
    return;
  }
  const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const safePath = normalize(join(publicRoot, requestedPath));
  if (!safePath.startsWith(publicRoot)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  const filePath = existsSync(safePath) && statSync(safePath).isFile() ? safePath : join(publicRoot, "index.html");
  response.writeHead(200, {
    "Content-Type": mime[extname(filePath)] ?? "application/octet-stream",
    "Cache-Control": process.env.NODE_ENV === "production" ? "public, max-age=300" : "no-store"
  });
  createReadStream(filePath).pipe(response);
}
