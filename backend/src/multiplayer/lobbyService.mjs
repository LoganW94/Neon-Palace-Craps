import { MODES } from "../../../shared/craps-engine.mjs";

export class LobbyService {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.tables = new Map();
    this.seedTables();
  }

  seedTables() {
    [
      ["practice-1", "Downtown Practice Rail", "practice"],
      ["casino-1", "Neon Palace Main Table", "casino"],
      ["crapless-1", "Crapless Neon Rail", "crapless"],
      ["high-1", "Skyline High Limit", "highRoller"],
      ["tutorial-1", "Beginner Friendly Table", "tutorial"]
    ].forEach(([id, name, mode]) => {
      this.tables.set(id, {
        id,
        name,
        mode,
        minimum: MODES[mode].min,
        maximum: MODES[mode].max,
        seats: 5,
        occupiedSeats: mode === "tutorial" ? 1 : Math.floor(1 + Math.random() * 4),
        spectators: Math.floor(Math.random() * 20),
        status: "open"
      });
    });
  }

  listTables() {
    return [...this.tables.values()];
  }

  createTable({ name, mode = "casino" }) {
    const id = `table-${Date.now().toString(36)}`;
    const table = {
      id,
      name,
      mode,
      minimum: MODES[mode]?.min ?? 10,
      maximum: MODES[mode]?.max ?? 5000,
      seats: 5,
      occupiedSeats: 0,
      spectators: 0,
      status: "open"
    };
    this.tables.set(id, table);
    this.eventBus.emit("table.created", table);
    return table;
  }
}
