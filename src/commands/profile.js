const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserProfile, saveUserProfile, removeItem } = require('../database/db');

module.exports = {
  name: 'profile',
  aliases: ['p', 'my', 'quest', 'marry', 'divorce', 'bio'],
  description: 'View user profile, quests, or manage marriage.',
  slashData: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your RPG profile'),

  async executeMessage(message, args) {
    const commandName = message.content.split(' ')[1] || 'profile';
    const sub = commandName.toLowerCase();

    if (sub === 'quest' || sub === 'quests') return handleQuests(message.author.id, message.author.username, message);
    if (sub === 'marry') return handleMarry(message.author.id, message.author.username, message.mentions.users.first(), message);
    if (sub === 'divorce') return handleDivorce(message.author.id, message.author.username, message);
    if (sub === 'bio') return handleBio(message.author.id, args.slice(1).join(' '), message);

    const targetUser = message.mentions.users.first() || message.author;
    return renderProfile(targetUser, message);
  },

  async executeSlash(interaction) {
    return renderProfile(interaction.user, null, interaction);
  }
};

const { generateProfileCard } = require('../utils/canvasCard');

async function renderProfile(user, messageObj = null, interactionObj = null) {
  const profile = getUserProfile(user.id);
  const totalAnimals = Object.values(profile.zoo || {}).reduce((a, b) => a + b, 0);

  try {
    const cardAttachment = await generateProfileCard(user, profile, totalAnimals);

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle(`👤 **${user.username}'s RPG Profile Card**`)
      .setImage('attachment://profile-card.png')
      .setFooter({ text: 'Developer: Senotron | Canvas Card Render' })
      .setTimestamp();

    const payload = { embeds: [embed], files: [cardAttachment] };
    return interactionObj ? interactionObj.reply(payload) : messageObj.reply(payload);
  } catch (err) {
    console.error('Canvas profile card error fallback:', err);
    // Fallback to text embed if canvas fails
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle(`👤 **${user.username}'s Profile**`)
      .setDescription(`*"${profile.bio}"*`)
      .addFields(
        { name: '🪙 Cowoncy Balance', value: `**${profile.cash.toLocaleString()}** 🪙`, inline: true },
        { name: '✨ Level & XP', value: `Level **${profile.level}** (${profile.xp} XP)`, inline: true },
        { name: '🐾 Zoo Count', value: `**${totalAnimals}** Animals`, inline: true }
      );
    const payload = { embeds: [embed] };
    return interactionObj ? interactionObj.reply(payload) : messageObj.reply(payload);
  }
}

function handleQuests(userId, username, messageObj) {
  const profile = getUserProfile(userId);
  const quests = profile.quests || {};

  const embed = new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle(`📜 **${username}'s Daily Quests**`)
    .setDescription(
      `1. **Hunt 5 Wild Animals:** Progress: \`${quests.huntsCompleted || 0}/5\` | Reward: +500 🪙\n` +
      `2. **Play 3 Slot Games:** Progress: \`${quests.slotsPlayed || 0}/3\` | Reward: +300 🪙\n` +
      `3. **Win 1 Pet Battle:** Progress: \`${quests.battlesWon || 0}/1\` | Reward: +1000 🪙\n\n` +
      `*Quests reset automatically every 24 hours!*`
    );

  return messageObj.reply({ embeds: [embed] });
}

function handleMarry(userId, username, targetUser, messageObj) {
  if (!targetUser || targetUser.bot || targetUser.id === userId) {
    return messageObj.reply('❌ Please mention a valid user to propose to! Example: `owo marry @User`');
  }

  const profile = getUserProfile(userId);

  if (profile.marriedTo) {
    return messageObj.reply('❌ You are already married! You must `owo divorce` before marrying someone else.');
  }

  if (!profile.inventory.ring_diamond || profile.inventory.ring_diamond <= 0) {
    return messageObj.reply('❌ You need a **Diamond Ring** 💍 to propose! Buy one from `owo shop`.');
  }

  const targetProfile = getUserProfile(targetUser.id);
  if (targetProfile.marriedTo) {
    return messageObj.reply(`❌ **${targetUser.username}** is already married to someone else!`);
  }

  // Consume ring and marry
  removeItem(userId, 'ring_diamond', 1);

  profile.marriedTo = targetUser.id;
  profile.marriageDate = Date.now();
  saveUserProfile(userId, profile);

  targetProfile.marriedTo = userId;
  targetProfile.marriageDate = Date.now();
  saveUserProfile(targetUser.id, targetProfile);

  const embed = new EmbedBuilder()
    .setColor(0xe91e63)
    .setTitle('💖 **JUST MARRIED!**')
    .setDescription(`💍 **${username}** and **${targetUser.username}** are now happily married! 🎉\n\nMay your zoo flourish together!`)
    .setTimestamp();

  return messageObj.reply({ embeds: [embed] });
}

function handleDivorce(userId, username, messageObj) {
  const profile = getUserProfile(userId);
  if (!profile.marriedTo) {
    return messageObj.reply('❌ You are currently single!');
  }

  const exPartnerId = profile.marriedTo;
  const exProfile = getUserProfile(exPartnerId);

  profile.marriedTo = null;
  profile.marriageDate = null;
  saveUserProfile(userId, profile);

  exProfile.marriedTo = null;
  exProfile.marriageDate = null;
  saveUserProfile(exPartnerId, exProfile);

  return messageObj.reply(`💔 **${username}** divorced <@${exPartnerId}>. You are now single.`);
}

function handleBio(userId, newBio, messageObj) {
  if (!newBio) return messageObj.reply('❌ Please provide a bio text! Example: `owo bio I am the master of animals!`');
  const profile = getUserProfile(userId);
  profile.bio = newBio.slice(0, 150);
  saveUserProfile(userId, profile);
  return messageObj.reply(`✅ Updated your profile bio to: *"${profile.bio}"*`);
}
