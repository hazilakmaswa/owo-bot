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
  }
};

/**
 * Ensure user profile exists in croxydb and returns a sanitized clone
 * @param {string} userId 
 * @returns {object} User profile data
 */
function getUserProfile(userId) {
  if (!userId) throw new Error('User ID is required');

  const key = `user_${userId}`;
  let profile = db.get(key);

  if (!profile) {
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
    if (updated) db.set(key, profile);
  }

  return profile;
}

/**
 * Save updated user profile to croxydb
 * @param {string} userId 
 * @param {object} profile 
 */
function saveUserProfile(userId, profile) {
  db.set(`user_${userId}`, profile);
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

module.exports = {
  getUserProfile,
  saveUserProfile,
  addCash,
  addAnimal,
  removeAnimal,
  addItem,
  removeItem,
  addXp,
  getCashLeaderboard
};
