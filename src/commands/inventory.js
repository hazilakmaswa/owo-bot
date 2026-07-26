const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserProfile, removeItem, addItem, addCash } = require('../database/db');

const SHOP_ITEMS = [
  { id: 'lootbox_common', name: 'Common Lootbox', price: 500, emoji: '📦', description: 'Contains 1 random Common or Uncommon animal!' },
  { id: 'lootbox_rare', name: 'Rare Lootbox', price: 2500, emoji: '🎁', description: 'High chance to drop Rare or Epic animals!' },
  { id: 'gem_luck', name: 'Luck Gem', price: 1500, emoji: '💎', description: 'Increases rare animal hunt chance by 30%!' },
  { id: 'ring_diamond', name: 'Diamond Ring', price: 10000, emoji: '💍', description: 'Propose marriage to a special someone with `owo marry`!' }
];

module.exports = {
  name: 'inventory',
  aliases: ['inv', 'shop', 'buy', 'use'],
  description: 'Manage your items, view shop, buy boxes or use luck gems.',
  slashData: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View your item inventory'),

  async executeMessage(message, args) {
    const commandName = message.content.split(' ')[1] || 'inv';
    const sub = commandName.toLowerCase();

    if (sub === 'shop') return handleShop(message);
    if (sub === 'buy') return handleBuy(message.author.id, message.author.username, args, message);
    if (sub === 'use') return handleUse(message.author.id, message.author.username, args, message);

    return handleInventory(message.author.id, message.author.username, message);
  },

  async executeSlash(interaction) {
    return handleInventory(interaction.user.id, interaction.user.username, null, interaction);
  }
};

function handleInventory(userId, username, messageObj = null, interactionObj = null) {
  const profile = getUserProfile(userId);
  const inv = profile.inventory || {};

  const itemList = [];
  for (const itemId in inv) {
    const count = inv[itemId];
    if (count <= 0) continue;
    const shopItem = SHOP_ITEMS.find(i => i.id === itemId) || { name: itemId, emoji: '🎒' };
    itemList.push(`${shopItem.emoji} **${shopItem.name}** ×${count}`);
  }

  const embed = new EmbedBuilder()
    .setColor(0x1abc9c)
    .setTitle(`🎒 **${username}'s Inventory**`)
    .setDescription(
      itemList.length > 0
        ? itemList.join('\n')
        : '*(Your inventory is empty! Check `owo shop` to purchase items.)*'
    )
    .setFooter({ text: 'Use "owo use <item>" to consume an item.' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`open_shop_${userId}`).setLabel('Open Shop 🏪').setStyle(ButtonStyle.Primary)
  );

  const payload = { embeds: [embed], components: [row] };
  return interactionObj ? interactionObj.reply(payload) : messageObj.reply(payload);
}

function handleShop(messageObj) {
  let shopText = SHOP_ITEMS.map((item, idx) => {
    return `**${idx + 1}. ${item.emoji} ${item.name}** - **${item.price.toLocaleString()}** 🪙\n└ *${item.description}*\n`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0xf39c12)
    .setTitle('🏪 **OwO Item Shop**')
    .setDescription(shopText + '\n*To buy an item, use:* `owo buy <item_name_or_number>`')
    .setFooter({ text: 'Example: owo buy 1' });

  return messageObj.reply({ embeds: [embed] });
}

function handleBuy(userId, username, args, messageObj) {
  if (!args[0]) return messageObj.reply('❌ Please specify an item to buy! Example: `owo buy 1` or `owo buy luck`');

  let targetItem = null;
  const input = args[0].toLowerCase();

  if (!isNaN(input)) {
    const index = parseInt(input) - 1;
    if (index >= 0 && index < SHOP_ITEMS.length) targetItem = SHOP_ITEMS[index];
  } else {
    targetItem = SHOP_ITEMS.find(i => i.id.includes(input) || i.name.toLowerCase().includes(input));
  }

  if (!targetItem) {
    return messageObj.reply('❌ Item not found in shop. Check `owo shop` for item numbers!');
  }

  const profile = getUserProfile(userId);
  if (profile.cash < targetItem.price) {
    return messageObj.reply(`❌ You don't have enough Cowoncy! Price: **${targetItem.price}** 🪙 | Your Cash: **${profile.cash}** 🪙`);
  }

  addCash(userId, -targetItem.price);
  addItem(userId, targetItem.id, 1);

  return messageObj.reply(`🎉 Purchased **1x** ${targetItem.emoji} **${targetItem.name}** for **${targetItem.price}** 🪙! Added to your \`owo inv\`.`);
}

function handleUse(userId, username, args, messageObj) {
  if (!args[0]) return messageObj.reply('❌ Please specify an item to use! Example: `owo use lootbox`');

  const input = args[0].toLowerCase();
  const profile = getUserProfile(userId);

  const matchedItemId = Object.keys(profile.inventory).find(id => id.includes(input) && profile.inventory[id] > 0);
  if (!matchedItemId) {
    return messageObj.reply(`❌ You don't have any matching items in your inventory (\`owo inv\`).`);
  }

  removeItem(userId, matchedItemId, 1);

  if (matchedItemId.startsWith('lootbox')) {
    const rewards = ['fox', 'wolf', 'dragon', 'unicorn', 'bear'];
    const randomAnimal = rewards[Math.floor(Math.random() * rewards.length)];
    const { addAnimal } = require('../database/db');
    const { getAnimalById } = require('../systems/animals');

    addAnimal(userId, randomAnimal, 1);
    const animal = getAnimalById(randomAnimal);

    return messageObj.reply(`🎁 **Lootbox Opened!** You unboxed a rare ${animal.emoji} **${animal.name}** (${animal.rarity})! Added to your Zoo!`);
  }

  return messageObj.reply(`✨ Successfully used **1x** \`${matchedItemId}\`!`);
}
