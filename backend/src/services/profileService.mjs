export class ProfileService {
  constructor() {
    this.profiles = new Map();
  }

  getGuestProfile() {
    const id = "guest-local";
    if (!this.profiles.has(id)) {
      this.profiles.set(id, {
        id,
        displayName: "Local Shooter",
        xp: 0,
        level: 1,
        achievements: ["First buy-in"],
        friends: [],
        stats: { sessions: 0, rolls: 0, net: 0 }
      });
    }
    return this.profiles.get(id);
  }
}
