const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserProfile, removeAnimal, addCash } = require('../database/db');
const { ANIMALS, RARITIES, getAnimalById } = require('../systems/animals');

module.exports = {
  name: 'zoo',
  aliases: ['z', 'animals'],
  description: 'View your animal zoo collection, sell animals, or sacrifice them for essence.',
  slashData: new SlashCommandBuilder()
    .setName('zoo')
    .setDescription('View your animal zoo collection'),

  async executeMessage(message, args) {
    const sub = args[0] ? args[0].toLowerCase() : '';
    if (sub === 'sell') {
      return handleSell(message.author.id, message.author.username, args.slice(1), message);
    }
    if (sub === 'sac' || sub === 'sacrifice') {
      return handleSacrifice(message.author.id, message.author.username, args.slice(1), message);
    }
    return renderZoo(message.author.id, message.author.username, 'ALL', message);
  },

  async executeSlash(interaction) {
    return renderZoo(interaction.user.id, interaction.user.username, 'ALL', null, interaction);
  }
};

/**
 * Render Zoo Embed with Component V2 Select Menu and Buttons
 */
function renderZoo(userId, username, filterRarity = 'ALL', messageObj = null, interactionObj = null) {
  const profile = getUserProfile(userId);
  const zooData = profile.zoo || {};

  let totalAnimals = 0;
  let uniqueAnimals = Object.keys(zooData).length;

  const groupedByRarity = {};

  for (const animalId in zooData) {
    const count = zooData[animalId];
    if (count <= 0) continue;
    const animal = getAnimalById(animalId);
    if (!animal) continue;

    totalAnimals += count;

    if (filterRarity !== 'ALL' && animal.rarity !== filterRarity) {
      continue;
    }

    if (!groupedByRarity[animal.rarity]) {
      groupedByRarity[animal.rarity] = [];
    }
    groupedByRarity[animal.rarity].push({ animal, count });
  }

  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle(`🐾 **${username}'s Zoo Collection**`)
    .setDescription(
      `Total Animals: **${totalAnimals}** | Unique Species: **${uniqueAnimals}** / ${ANIMALS.length}\n` +
      `Filter: **${filterRarity}**\n\n` +
      formatZooDisplay(groupedByRarity)
    )
    .setFooter({ text: 'Use "owo sell <animal>" or "owo sac <animal>" to manage your zoo.' })
    .setTimestamp();

  // Components V2 Select Menu for Rarity Filtering
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`zoo_filter_${userId}`)
    .setPlaceholder('Filter by Rarity...')
    .addOptions([
      { label: 'All Rarities', value: 'ALL', emoji: '🐾' },
      { label: 'Common Animals', value: 'COMMON', emoji: '🐱' },
      { label: 'Uncommon Animals', value: 'UNCOMMON', emoji: '🦊' },
      { label: 'Rare Animals', value: 'RARE', emoji: '🐺' },
      { label: 'Epic Animals', value: 'EPIC', emoji: '🐲' },
      { label: 'Legendary Animals', value: 'LEGENDARY', emoji: '⚡' },
      { label: 'Special & Gem', value: 'GEM', emoji: '💎' }
    ]);

  const menuRow = new ActionRowBuilder().addComponents(selectMenu);

  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`zoo_sell_duplicates_${userId}`)
      .setLabel('Sell Duplicates 🪙')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`zoo_sacrifice_${userId}`)
      .setLabel('Sacrifice All Commons ✨')
      .setStyle(ButtonStyle.Danger)
  );

  const payload = { embeds: [embed], components: [menuRow, buttonRow] };

  if (interactionObj) {
    return interactionObj.reply(payload);
  }
  return messageObj.reply(payload);
}

function formatZooDisplay(groupedByRarity) {
  if (Object.keys(groupedByRarity).length === 0) {
    return '*(No animals found in this category. Go hunt with `owo hunt`!)*';
  }

  let text = '';
  for (const rarityKey in groupedByRarity) {
    const list = groupedByRarity[rarityKey];
    text += `__**${rarityKey}**__\n`;
    text += list.map(item => `${item.animal.emoji} **${item.animal.name}** ×${item.count}`).join(' | ');
    text += '\n\n';
  }
  return text;
}

function handleSell(userId, username, args, messageObj) {
  const profile = getUserProfile(userId);
  const animalId = args[0] ? args[0].toLowerCase() : null;

  if (!animalId) {
    return messageObj.reply('❌ Please specify an animal to sell! Example: `owo sell cat`');
  }

  const animal = getAnimalById(animalId);
  if (!animal) {
    return messageObj.reply(`❌ Unknown animal \`${animalId}\`. Check your \`owo zoo\` for valid names.`);
  }

  const countToSell = args[1] && !isNaN(args[1]) ? parseInt(args[1]) : 1;
  const owned = profile.zoo[animal.id] || 0;

  if (owned < countToSell) {
    return messageObj.reply(`❌ You only own **${owned}** ${animal.emoji} **${animal.name}**(s)!`);
  }

  const rarityInfo = RARITIES[animal.rarity];
  const totalValue = rarityInfo.sellValue * countToSell;

  removeAnimal(userId, animal.id, countToSell);
  addCash(userId, totalValue);

  return messageObj.reply(`💰 Sold **${countToSell}x** ${animal.emoji} **${animal.name}** for **+${totalValue}** 🪙 Cowoncy!`);
}

function handleSacrifice(userId, username, args, messageObj) {
  const profile = getUserProfile(userId);
  const animalId = args[0] ? args[0].toLowerCase() : null;

  if (!animalId) {
    return messageObj.reply('❌ Please specify an animal to sacrifice! Example: `owo sac dog`');
  }

  const animal = getAnimalById(animalId);
  if (!animal) {
    return messageObj.reply(`❌ Unknown animal \`${animalId}\`.`);
  }

  const owned = profile.zoo[animal.id] || 0;
  if (owned <= 0) {
    return messageObj.reply(`❌ You don't own any ${animal.emoji} **${animal.name}**!`);
  }

  const rarityInfo = RARITIES[animal.rarity];
  const essenceEarned = rarityInfo.essence;

  removeAnimal(userId, animal.id, 1);

  return messageObj.reply(`✨ Sacrificed **1x** ${animal.emoji} **${animal.name}** to the gods and received **+${essenceEarned}** Essence!`);
}
