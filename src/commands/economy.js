const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserProfile, saveUserProfile, addCash, getCashLeaderboard } = require('../database/db');

module.exports = {
  name: 'economy',
  aliases: ['cash', 'money', 'bal', 'balance', 'daily', 'pray', 'curse', 'give', 'pay', 'top', 'lb'],
  description: 'Economy commands: check cash, daily rewards, pray, curse, or transfer Cowoncy.',
  slashData: new SlashCommandBuilder()
    .setName('cash')
    .setDescription('Check your Cowoncy balance'),

  async executeMessage(message, args) {
    const commandName = message.content.split(' ')[1] || 'cash';
    const sub = commandName.toLowerCase();

    if (sub === 'daily') return handleDaily(message.author.id, message.author.username, message);
    if (sub === 'pray') return handlePray(message.author.id, message.author.username, message, args);
    if (sub === 'curse') return handleCurse(message.author.id, message.author.username, message, args);
    if (sub === 'give' || sub === 'pay') return handleGive(message.author.id, message, message.mentions.users.first(), args[1], message);
    if (sub === 'top' || sub === 'lb' || sub === 'leaderboard') return handleLeaderboard(message);

    // Default: Check Cash
    const profile = getUserProfile(message.author.id);
    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle(`🪙 **${message.author.username}'s Wallet**`)
      .setDescription(`Cowoncy Balance: **${profile.cash.toLocaleString()}** 🪙\nLevel: **${profile.level}** (XP: ${profile.xp})`)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction) {
    const profile = getUserProfile(interaction.user.id);
    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle(`🪙 **${interaction.user.username}'s Wallet**`)
      .setDescription(`Cowoncy Balance: **${profile.cash.toLocaleString()}** 🪙\nLevel: **${profile.level}** (XP: ${profile.xp})`)
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};

function handleDaily(userId, username, messageObj) {
  const profile = getUserProfile(userId);
  const now = Date.now();
  const COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

  if (now - profile.lastDaily < COOLDOWN) {
    const remainingMs = COOLDOWN - (now - profile.lastDaily);
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    return messageObj.reply(`⏱️ **Daily Cooldown!** You can claim your next daily reward in **${hours}h ${minutes}m**.`);
  }

  // Calculate streak bonus
  if (now - profile.lastDaily < COOLDOWN * 2) {
    profile.dailyStreak = (profile.dailyStreak || 0) + 1;
  } else {
    profile.dailyStreak = 1;
  }

  profile.lastDaily = now;
  const baseReward = 1000;
  const streakBonus = (profile.dailyStreak - 1) * 100;
  const totalReward = baseReward + streakBonus;

  profile.cash += totalReward;
  saveUserProfile(userId, profile);

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`🎁 **Daily Claimed for ${username}!**`)
    .setDescription(
      `Received: **+${totalReward.toLocaleString()}** 🪙 Cowoncy!\n` +
      `Daily Streak: **${profile.dailyStreak} Days** 🔥 (Bonus: +${streakBonus} 🪙)`
    )
    .setFooter({ text: 'Come back in 24 hours for your next streak reward!' });

  return messageObj.reply({ embeds: [embed] });
}

function handlePray(userId, username, messageObj, args) {
  const targetUser = messageObj.mentions.users.first() || messageObj.author;
  const profile = getUserProfile(userId);
  const now = Date.now();
  const COOLDOWN = 5 * 60 * 1000; // 5 minutes

  if (now - profile.lastPray < COOLDOWN) {
    const remainingSec = Math.ceil((COOLDOWN - (now - profile.lastPray)) / 1000);
    return messageObj.reply(`⏱️ Please wait **${remainingSec}s** before praying again.`);
  }

  profile.lastPray = now;
  profile.prayCount = (profile.prayCount || 0) + 1;
  saveUserProfile(userId, profile);

  // Increment luck bonus for target
  const targetProfile = getUserProfile(targetUser.id);
  targetProfile.prayCount = (targetProfile.prayCount || 0) + 1;
  saveUserProfile(targetUser.id, targetProfile);

  return messageObj.reply(`🙏🏻 **${username}** prayed for **${targetUser.username}**! (Total blessings: ✨ ${targetProfile.prayCount})`);
}

function handleCurse(userId, username, messageObj, args) {
  const targetUser = messageObj.mentions.users.first() || messageObj.author;
  const profile = getUserProfile(userId);
  const now = Date.now();
  const COOLDOWN = 5 * 60 * 1000; // 5 minutes

  if (now - profile.lastCurse < COOLDOWN) {
    const remainingSec = Math.ceil((COOLDOWN - (now - profile.lastCurse)) / 1000);
    return messageObj.reply(`⏱️ Please wait **${remainingSec}s** before cursing again.`);
  }

  profile.lastCurse = now;
  profile.curseCount = (profile.curseCount || 0) + 1;
  saveUserProfile(userId, profile);

  const targetProfile = getUserProfile(targetUser.id);
  targetProfile.curseCount = (targetProfile.curseCount || 0) + 1;
  saveUserProfile(targetUser.id, targetProfile);

  return messageObj.reply(`💀 **${username}** cast a curse upon **${targetUser.username}**! (Total curses: 😈 ${targetProfile.curseCount})`);
}

function handleGive(senderId, senderName, targetUser, amountStr, messageObj) {
  if (!targetUser || targetUser.bot || targetUser.id === senderId) {
    return messageObj.reply('❌ Please mention a valid user to send Cowoncy to! Example: `owo give @User 500`');
  }

  const amount = parseInt(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return messageObj.reply('❌ Please specify a valid amount of Cowoncy to give!');
  }

  const senderProfile = getUserProfile(senderId);
  if (senderProfile.cash < amount) {
    return messageObj.reply(`❌ You don't have enough Cowoncy! Your balance: **${senderProfile.cash}** 🪙`);
  }

  addCash(senderId, -amount);
  addCash(targetUser.id, amount);

  return messageObj.reply(`💸 **${senderName}** transferred **${amount.toLocaleString()}** 🪙 Cowoncy to **${targetUser.username}**!`);
}

function handleLeaderboard(messageObj) {
  const topList = getCashLeaderboard(10);

  let desc = topList.map((entry, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**#${index + 1}**`;
    return `${medal} <@${entry.userId}> - **${entry.cash.toLocaleString()}** 🪙 (Level ${entry.level})`;
  }).join('\n');

  if (!desc) desc = 'No players registered yet!';

  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle('🏆 **OwO Global Wealth Leaderboard**')
    .setDescription(desc)
    .setTimestamp();

  return messageObj.reply({ embeds: [embed] });
}
