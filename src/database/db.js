const db = require('croxydb');

/**
 * Default user profile structure for OwO Bot
 */
const DEFAULT_PROFILE = {
  cash: 1000,
  xp: 0,
  level: 1,
  zoo: {}, // animalId: count
  inventory: {
    lootbox_common: 2,
    gem_luck: 1
  },
  team: [], // Array of animalIds (max 3)
  equippedGems: [],
  dailyStreak: 0,
  lastDaily: 0,
  lastPray: 0,
  lastCurse: 0,
  lastHunt: 0,
  lastBattle: 0,
  prayCount: 0,
  curseCount: 0,
  marriedTo: null,
  marriageDate: null,
  bio: 'I love OwO Bot!',
  quests: {
    huntsCompleted: 0,
    slotsPlayed: 0,
    battlesWon: 0,
    lastQuestReset: 0
  },
  // internal version for optimistic updates (incremented on save)
  _v: 1
};

/**
 * Ensure user profile exists in croxydb and returns a sanitized clone
 * @param {string} userId 
 * @returns {object} User profile data (cloned)
 */
function getUserProfile(userId) {
  if (!userId) throw new Error('User ID is required');

  const key = `user_${userId}`;
  let profile = db.get(key);

  if (!profile) {
    // deep clone default to avoid shared references
    profile = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
    db.set(key, profile);
  } else {
    // Fill in any missing properties from schema updates
    let updated = false;
    for (const prop in DEFAULT_PROFILE) {
      if (profile[prop] === undefined) {
        profile[prop] = JSON.parse(JSON.stringify(DEFAULT_PROFILE[prop]));
        updated = true;
      }
    }
    // ensure internal version exists
    if (profile._v === undefined) {
      profile._v = 1;
      updated = true;
    }
    if (updated) db.set(key, profile);
  }

  // return a clone to avoid accidental external mutation
  return JSON.parse(JSON.stringify(profile));
}

/**
 * Save updated user profile to croxydb
 * Increments internal version _v.
 * NOTE: This is NOT atomic across concurrent processes. For true atomicity use a DB with transactions or an external lock.
 * @param {string} userId 
 * @param {object} profile 
 */
function saveUserProfile(userId, profile) {
  if (!userId) throw new Error('User ID is required');
  if (!profile || typeof profile !== 'object') throw new Error('Profile object is required');

  // increment version to signal an update
  profile._v = (profile._v || 1) + 1;
  db.set(`user_${userId}`, profile);
}

/**
 * Attempt to save profile with optimistic version check.
 * Returns true on success, false if version mismatch detected.
 * This pattern reduces accidental overwrites but is not a replacement for transactions.
 * @param {string} userId
 * @param {object} profile
 * @param {number} expectedVersion
 * @returns {boolean}
 */
function saveUserProfileIfVersion(userId, profile, expectedVersion) {
  if (!userId) throw new Error('User ID is required');
  if (expectedVersion === undefined) throw new Error('expectedVersion is required');

  const key = `user_${userId}`;
  const current = db.get(key) || {};
  const currentV = current._v || 1;

  if (currentV !== expectedVersion) {
    return false;
  }

  profile._v = currentV + 1;
  db.set(key, profile);
  return true;
}

/**
 * Add or subtract user cash
 * @param {string} userId 
 * @param {number} amount 
 * @returns {number} New balance
 */
function addCash(userId, amount) {
  const profile = getUserProfile(userId);
  profile.cash = Math.max(0, (profile.cash || 0) + amount);
  saveUserProfile(userId, profile);
  return profile.cash;
}

/**
 * Transfer cash between two users (basic check)
 * @param {string} fromUserId
 * @param {string} toUserId
 * @param {number} amount
 * @returns {{success: boolean, message?: string}}
 */
function transferCash(fromUserId, toUserId, amount) {
  if (!fromUserId || !toUserId) return { success: false, message: 'User IDs required' };
  if (fromUserId === toUserId) return { success: false, message: 'Cannot transfer to same user' };
  if (!Number.isFinite(amount) || amount <= 0) return { success: false, message: 'Invalid amount' };

  const fromProfile = getUserProfile(fromUserId);
  if ((fromProfile.cash || 0) < amount) {
    return { success: false, message: 'Insufficient funds' };
  }
  const toProfile = getUserProfile(toUserId);

  fromProfile.cash = Math.max(0, fromProfile.cash - amount);
  toProfile.cash = (toProfile.cash || 0) + amount;

  // Save both profiles (note: not atomic)
  saveUserProfile(fromUserId, fromProfile);
  saveUserProfile(toUserId, toProfile);
  return { success: true };
}

/**
 * Add an animal to user zoo
 * @param {string} userId 
 * @param {string} animalId 
 * @param {number} count 
 */
function addAnimal(userId, animalId, count = 1) {
  const profile = getUserProfile(userId);
  profile.zoo[animalId] = (profile.zoo[animalId] || 0) + count;
  saveUserProfile(userId, profile);
}

/**
 * Remove an animal from user zoo
 * @param {string} userId 
 * @param {string} animalId 
 * @param {number} count 
 * @returns {boolean} Success
 */
function removeAnimal(userId, animalId, count = 1) {
  const profile = getUserProfile(userId);
  if (!profile.zoo[animalId] || profile.zoo[animalId] < count) {
    return false;
  }
  profile.zoo[animalId] -= count;
  if (profile.zoo[animalId] <= 0) {
    delete profile.zoo[animalId];
    // Remove from team if no longer owned
    profile.team = profile.team.filter(id => id !== animalId);
  }
  saveUserProfile(userId, profile);
  return true;
}

/**
 * Add an item to user inventory
 * @param {string} userId 
 * @param {string} itemId 
 * @param {number} count 
 */
function addItem(userId, itemId, count = 1) {
  const profile = getUserProfile(userId);
  profile.inventory[itemId] = (profile.inventory[itemId] || 0) + count;
  saveUserProfile(userId, profile);
}

/**
 * Remove an item from user inventory
 * @param {string} userId 
 * @param {string} itemId 
 * @param {number} count 
 * @returns {boolean}
 */
function removeItem(userId, itemId, count = 1) {
  const profile = getUserProfile(userId);
  if (!profile.inventory[itemId] || profile.inventory[itemId] < count) {
    return false;
  }
  profile.inventory[itemId] -= count;
  if (profile.inventory[itemId] <= 0) {
    delete profile.inventory[itemId];
  }
  saveUserProfile(userId, profile);
  return true;
}

/**
 * Add XP and handle leveling up
 * @param {string} userId 
 * @param {number} xpAmount 
 * @returns {{leveledUp: boolean, newLevel: number, newXp: number}}
 */
function addXp(userId, xpAmount) {
  const profile = getUserProfile(userId);
  profile.xp += xpAmount;
  let leveledUp = false;

  const nextLevelXp = profile.level * 1000;
  if (profile.xp >= nextLevelXp) {
    profile.level += 1;
    profile.xp -= nextLevelXp;
    leveledUp = true;
  }

  saveUserProfile(userId, profile);
  return { leveledUp, newLevel: profile.level, newXp: profile.xp };
}

/**
 * Get top cash leaderboard
 * @param {number} limit 
 * @returns {Array<{userId: string, cash: number, level: number}>}
 */
function getCashLeaderboard(limit = 10) {
  const allData = db.all();
  const leaderboards = [];

  for (const entry of allData) {
    if (entry.k && entry.k.startsWith('user_')) {
      const userId = entry.k.replace('user_', '');
      const data = entry.v;
      if (data && typeof data.cash === 'number') {
        leaderboards.push({
          userId,
          cash: data.cash,
          level: data.level || 1
        });
      }
    }
  }

  return leaderboards.sort((a, b) => b.cash - a.cash).slice(0, limit);
}

/**
 * Team management helpers
 */
function setTeam(userId, teamArray = []) {
  const profile = getUserProfile(userId);
  // enforce max 3 and only keep animals user owns
  const owned = profile.zoo || {};
  const filtered = (teamArray || []).filter(id => owned[id] && owned[id] > 0).slice(0, 3);
  profile.team = filtered;
  saveUserProfile(userId, profile);
  return profile.team;
}

function equipGem(userId, gemId) {
  const profile = getUserProfile(userId);
  if (!profile.inventory[gemId] || profile.inventory[gemId] <= 0) {
    return false;
  }
  // move gem from inventory to equippedGems
  profile.inventory[gemId] -= 1;
  if (profile.inventory[gemId] <= 0) delete profile.inventory[gemId];
  profile.equippedGems = profile.equippedGems || [];
  profile.equippedGems.push(gemId);
  saveUserProfile(userId, profile);
  return true;
}

function unequipGem(userId, gemId) {
  const profile = getUserProfile(userId);
  profile.equippedGems = profile.equippedGems || [];
  const idx = profile.equippedGems.indexOf(gemId);
  if (idx === -1) return false;
  profile.equippedGems.splice(idx, 1);
  profile.inventory[gemId] = (profile.inventory[gemId] || 0) + 1;
  saveUserProfile(userId, profile);
  return true;
}

/**
 * Battle system storage helpers (keep battles in croxydb under keys 'battle_{battleId}')
 * Battle object shape is flexible; example:
 * {
 *   id: 'battle-uuid',
 *   players: [ { userId, team, hpState, ready }, ... ],
 *   turn: 0,
 *   status: 'pending'|'active'|'ended',
 *   winner: null,
 *   createdAt: 123456789,
 *   updatedAt: 123456789
 * }
 */

/**
 * Create a new battle
 * @param {string} battleId
 * @param {object} battleData
 */
function createBattle(battleId, battleData = {}) {
  if (!battleId) throw new Error('battleId required');
  const key = `battle_${battleId}`;
  const now = Date.now();
  const payload = Object.assign({
    id: battleId,
    players: [],
    turn: 0,
    status: 'pending',
    winner: null,
    createdAt: now,
    updatedAt: now
  }, battleData);
  db.set(key, payload);
  return JSON.parse(JSON.stringify(payload));
}

/**
 * Get a battle by id
 * @param {string} battleId
 */
function getBattle(battleId) {
  if (!battleId) return null;
  const key = `battle_${battleId}`;
  const b = db.get(key);
  return b ? JSON.parse(JSON.stringify(b)) : null;
}

/**
 * Update battle with a patch (shallow merge); returns updated battle
 * @param {string} battleId
 * @param {object} patch
 */
function updateBattle(battleId, patch = {}) {
  if (!battleId) throw new Error('battleId required');
  const key = `battle_${battleId}`;
  const current = db.get(key) || {};
  const updated = Object.assign({}, current, patch, { updatedAt: Date.now() });
  db.set(key, updated);
  return JSON.parse(JSON.stringify(updated));
}

/**
 * End a battle (set status to ended and optionally set winner)
 * @param {string} battleId
 * @param {string|null} winnerUserId
 */
function endBattle(battleId, winnerUserId = null) {
  const battle = getBattle(battleId);
  if (!battle) return null;
  battle.status = 'ended';
  battle.winner = winnerUserId;
  battle.updatedAt = Date.now();
  db.set(`battle_${battleId}`, battle);
  return JSON.parse(JSON.stringify(battle));
}

/**
 * Remove a battle from storage
 * @param {string} battleId
 */
function deleteBattle(battleId) {
  if (!battleId) return false;
  const key = `battle_${battleId}`;
  db.delete(key);
  return true;
}

/**
 * Get list of battles for a user (scans all battle_* keys)
 * @param {string} userId
 */
function getUserBattles(userId) {
  const all = db.all();
  const battles = [];
  for (const entry of all) {
    if (entry.k && entry.k.startsWith('battle_')) {
      const b = entry.v;
      if (!b) continue;
      if (Array.isArray(b.players) && b.players.find(p => p.userId === userId)) {
        battles.push(b);
      }
    }
  }
  return battles;
}

module.exports = {
  getUserProfile,
  saveUserProfile,
  saveUserProfileIfVersion,
  addCash,
  transferCash,
  addAnimal,
  removeAnimal,
  addItem,
  removeItem,
  addXp,
  getCashLeaderboard,
  setTeam,
  equipGem,
  unequipGem,
  // battle APIs
  createBattle,
  getBattle,
  updateBattle,
  endBattle,
  deleteBattle,
  getUserBattles
};
