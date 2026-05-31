export async function getLobbyTables() {
  const response = await fetch("/api/lobby/tables");
  return response.json();
}

export async function getProfile() {
  const response = await fetch("/api/profile/me");
  return response.json();
}

export async function getMultiplayerBlueprint() {
  const response = await fetch("/api/multiplayer/blueprint");
  return response.json();
}
