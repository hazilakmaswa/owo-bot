const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { ANIMALS, RARITIES } = require('./animals');
const { getUserProfile, addAnimal, addCash, addXp } = require('../database/db');

/**
 * Execute a hunt action for a user
 * @param {string} userId 
 * @param {string} username 
 * @returns {object} { embed, components, animalCaught, cashEarned, xpEarned, leveledUp }
 */
function performHunt(userId, username) {
  const profile = getUserProfile(userId);

  // Calculate weighted drop chances
  let totalWeight = 0;
  const weightedAnimals = [];

  for (const animal of ANIMALS) {
    const rarityConfig = RARITIES[animal.rarity];
    let weight = rarityConfig.dropChance;

    // Check if luck gem bonus applies
    if (profile.inventory.gem_luck && profile.inventory.gem_luck > 0) {
      if (animal.rarity !== 'COMMON') {
        weight = Math.floor(weight * 1.3); // 30% luck boost for non-commons
      }
    }

    totalWeight += weight;
    weightedAnimals.push({ animal, weight });
  }

  // Roll random number
  let randomRoll = Math.floor(Math.random() * totalWeight);
  let selectedAnimal = ANIMALS[0];

  for (const item of weightedAnimals) {
    if (randomRoll < item.weight) {
      selectedAnimal = item.animal;
      break;
    }
    randomRoll -= item.weight;
  }

  // Add animal to zoo
  addAnimal(userId, selectedAnimal.id, 1);

  // Bonus reward: Cash & XP
  const rarityInfo = RARITIES[selectedAnimal.rarity];
  const cashEarned = Math.floor(Math.random() * 25) + 10;
  const xpEarned = Math.floor(Math.random() * 15) + 5;

  addCash(userId, cashEarned);
  const xpResult = addXp(userId, xpEarned);

  // Build sleek response embed
  const embed = new EmbedBuilder()
    .setColor(rarityInfo.color)
    .setTitle(`🌿 **${username} went hunting!**`)
    .setDescription(
      `You found and caught a **${selectedAnimal.rarity}** ${selectedAnimal.emoji} **${selectedAnimal.name}**!\n\n` +
      `🪙 **+${cashEarned}** Cowoncy | ✨ **+${xpEarned}** XP` +
      (xpResult.leveledUp ? `\n🎉 **LEVEL UP!** You reached **Level ${xpResult.newLevel}**!` : '')
    )
    .setThumbnail(`https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/${getEmojiUnicode(selectedAnimal.emoji)}.png`)
    .setFooter({ text: `Rarity: ${selectedAnimal.rarity} | Sell Value: ${rarityInfo.sellValue} 🪙` })
    .setTimestamp();

  // Create interactive "Hunt Again" button
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`hunt_again_${userId}`)
      .setLabel('Hunt Again 🌿')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`view_zoo_${userId}`)
      .setLabel('View Zoo 🐾')
      .setStyle(ButtonStyle.Primary)
  );

  return {
    embed,
    components: [row],
    selectedAnimal,
    cashEarned,
    xpEarned
  };
}

/**
 * Helper to get Twemoji image URL from unicode emoji
 * @param {string} emoji 
 */
function getEmojiUnicode(emoji) {
  if (!emoji) return '1f431';
  const comp = emoji.codePointAt(0).toString(16);
  return comp;
}

module.exports = {
  performHunt
};
