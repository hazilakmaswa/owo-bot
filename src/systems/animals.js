/**
 * Comprehensive Animal Database for OwO Bot Clone
 */
const RARITIES = {
  COMMON: { name: 'Common', color: 0x95a5a6, dropChance: 500, sellValue: 20, essence: 1 },
  UNCOMMON: { name: 'Uncommon', color: 0x2ecc71, dropChance: 250, sellValue: 50, essence: 3 },
  RARE: { name: 'Rare', color: 0x3498db, dropChance: 120, sellValue: 150, essence: 8 },
  EPIC: { name: 'Epic', color: 0x9b59b6, dropChance: 70, sellValue: 400, essence: 20 },
  MYTHICAL: { name: 'Mythical', color: 0xe67e22, dropChance: 35, sellValue: 1000, essence: 50 },
  LEGENDARY: { name: 'Legendary', color: 0xf1c40f, dropChance: 15, sellValue: 3000, essence: 150 },
  FABLED: { name: 'Fabled', color: 0xe91e63, dropChance: 7, sellValue: 8000, essence: 400 },
  GEM: { name: 'Gem', color: 0x1abc9c, dropChance: 2, sellValue: 20000, essence: 1000 },
  SPECIAL: { name: 'Special', color: 0x00ffff, dropChance: 1, sellValue: 50000, essence: 2500 }
};

const ANIMALS = [
  // COMMON
  { id: 'cat', name: 'Cat', emoji: '🐱', rarity: 'COMMON', hp: 100, atk: 15, def: 5, speed: 20 },
  { id: 'dog', name: 'Dog', emoji: '🐶', rarity: 'COMMON', hp: 110, atk: 18, def: 8, speed: 18 },
  { id: 'mouse', name: 'Mouse', emoji: '🐭', rarity: 'COMMON', hp: 70, atk: 10, def: 3, speed: 30 },
  { id: 'hamster', name: 'Hamster', emoji: '🐹', rarity: 'COMMON', hp: 75, atk: 12, def: 4, speed: 25 },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰', rarity: 'COMMON', hp: 90, atk: 14, def: 6, speed: 28 },
  { id: 'pig', name: 'Pig', emoji: '🐷', rarity: 'COMMON', hp: 130, atk: 14, def: 12, speed: 10 },
  { id: 'cow', name: 'Cow', emoji: '🐮', rarity: 'COMMON', hp: 150, atk: 16, def: 15, speed: 8 },
  { id: 'chicken', name: 'Chicken', emoji: '🐔', rarity: 'COMMON', hp: 80, atk: 13, def: 4, speed: 22 },

  // UNCOMMON
  { id: 'fox', name: 'Fox', emoji: '🦊', rarity: 'UNCOMMON', hp: 140, atk: 25, def: 12, speed: 35 },
  { id: 'bear', name: 'Bear', emoji: '🐻', rarity: 'UNCOMMON', hp: 200, atk: 30, def: 20, speed: 15 },
  { id: 'koala', name: 'Koala', emoji: '🐨', rarity: 'UNCOMMON', hp: 160, atk: 20, def: 18, speed: 12 },
  { id: 'panda', name: 'Panda', emoji: '🐼', rarity: 'UNCOMMON', hp: 190, atk: 26, def: 22, speed: 14 },
  { id: 'tiger', name: 'Tiger', emoji: '🐯', rarity: 'UNCOMMON', hp: 175, atk: 35, def: 15, speed: 28 },
  { id: 'lion', name: 'Lion', emoji: '🦁', rarity: 'UNCOMMON', hp: 180, atk: 36, def: 16, speed: 26 },

  // RARE
  { id: 'wolf', name: 'Wolf', emoji: '🐺', rarity: 'RARE', hp: 220, atk: 45, def: 25, speed: 40 },
  { id: 'snake', name: 'Snake', emoji: '🐍', rarity: 'RARE', hp: 180, atk: 50, def: 15, speed: 45 },
  { id: 'gorilla', name: 'Gorilla', emoji: '🦍', rarity: 'RARE', hp: 300, atk: 48, def: 35, speed: 20 },
  { id: 'shark', name: 'Shark', emoji: '🦈', rarity: 'RARE', hp: 250, atk: 55, def: 22, speed: 38 },
  { id: 'eagle', name: 'Eagle', emoji: '🦅', rarity: 'RARE', hp: 200, atk: 48, def: 18, speed: 50 },

  // EPIC
  { id: 'dragon', name: 'Dragon', emoji: '🐲', rarity: 'EPIC', hp: 380, atk: 75, def: 45, speed: 45 },
  { id: 'unicorn', name: 'Unicorn', emoji: '🦄', rarity: 'EPIC', hp: 350, atk: 70, def: 50, speed: 55 },
  { id: 'phoenix', name: 'Phoenix', emoji: '🦚', rarity: 'EPIC', hp: 320, atk: 80, def: 38, speed: 60 },
  { id: 'kraken', name: 'Kraken', emoji: '🐙', rarity: 'EPIC', hp: 420, atk: 72, def: 55, speed: 30 },

  // MYTHICAL
  { id: 'pegasus', name: 'Pegasus', emoji: '🐴', rarity: 'MYTHICAL', hp: 500, atk: 110, def: 70, speed: 75 },
  { id: 'hydra', name: 'Hydra', emoji: '🐍', rarity: 'MYTHICAL', hp: 600, atk: 120, def: 80, speed: 40 },
  { id: 'cerberus', name: 'Cerberus', emoji: '🐕‍🦺', rarity: 'MYTHICAL', hp: 550, atk: 130, def: 75, speed: 65 },

  // LEGENDARY
  { id: 'thunder_god', name: 'Thunder Wolf', emoji: '⚡', rarity: 'LEGENDARY', hp: 800, atk: 180, def: 110, speed: 90 },
  { id: 'solar_lion', name: 'Solar Lion', emoji: '🦁', rarity: 'LEGENDARY', hp: 850, atk: 195, def: 120, speed: 85 },
  { id: 'frost_dragon', name: 'Frost Dragon', emoji: '❄️', rarity: 'LEGENDARY', hp: 900, atk: 185, def: 130, speed: 80 },

  // FABLED
  { id: 'cosmic_whale', name: 'Cosmic Whale', emoji: '🌌', rarity: 'FABLED', hp: 1300, atk: 260, def: 180, speed: 70 },
  { id: 'abyssal_demon', name: 'Abyssal Lord', emoji: '👿', rarity: 'FABLED', hp: 1200, atk: 300, def: 160, speed: 95 },

  // GEM
  { id: 'diamond_golem', name: 'Diamond Golem', emoji: '💎', rarity: 'GEM', hp: 2000, atk: 380, def: 350, speed: 50 },
  { id: 'ruby_phoenix', name: 'Ruby Phoenix', emoji: '🧧', rarity: 'GEM', hp: 1800, atk: 450, def: 280, speed: 110 },

  // SPECIAL
  { id: 'owo_emperor', name: 'OwO Emperor', emoji: '👑', rarity: 'SPECIAL', hp: 3000, atk: 650, def: 500, speed: 150 }
];

/**
 * Get animal object by ID
 * @param {string} id 
 */
function getAnimalById(id) {
  return ANIMALS.find(a => a.id === id);
}

/**
 * Filter animals by rarity name
 * @param {string} rarityKey 
 */
function getAnimalsByRarity(rarityKey) {
  return ANIMALS.filter(a => a.rarity === rarityKey);
}

module.exports = {
  RARITIES,
  ANIMALS,
  getAnimalById,
  getAnimalsByRarity
};
