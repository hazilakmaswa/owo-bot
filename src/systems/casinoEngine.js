const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserProfile, addCash } = require('../database/db');

const SLOT_SYMBOLS = ['💎', '7️⃣', '🍇', '🍒', '🍋', '🔔', '🍊'];

/**
 * Play Slot Machine
 * @param {string} userId 
 * @param {string} username 
 * @param {number} bet 
 */
function playSlots(userId, username, bet) {
  const profile = getUserProfile(userId);
  if (profile.cash < bet) {
    return { error: `You don't have enough Cowoncy! Your balance: **${profile.cash}** 🪙` };
  }

  // Deduct bet
  addCash(userId, -bet);

  // Roll 3 reels
  const s1 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
  const s2 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
  const s3 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];

  let multiplier = 0;
  if (s1 === s2 && s2 === s3) {
    if (s1 === '💎') multiplier = 50;
    else if (s1 === '7️⃣') multiplier = 25;
    else multiplier = 10;
  } else if (s1 === s2 || s2 === s3 || s1 === s3) {
    multiplier = 2;
  }

  const winnings = bet * multiplier;
  if (winnings > 0) {
    addCash(userId, winnings);
  }

  const netGain = winnings - bet;
  const won = multiplier > 0;

  const embed = new EmbedBuilder()
    .setColor(won ? 0x2ecc71 : 0xe74c3c)
    .setTitle(`🎰 **${username}'s Slot Machine**`)
    .setDescription(
      `╔═════════════╗\n` +
      `║  ${s1}  |  ${s2}  |  ${s3}  ║\n` +
      `╚═════════════╝\n\n` +
      (won
        ? `🎉 **WINNER!** You matched symbols and won **+${winnings}** 🪙 Cowoncy! (Multiplier: ${multiplier}x)`
        : `💔 You lost **${bet}** 🪙 Cowoncy. Better luck next time!`)
    )
    .setFooter({ text: `Bet: ${bet} 🪙 | Balance: ${getUserProfile(userId).cash} 🪙` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`spin_again_${userId}_${bet}`)
      .setLabel(`Spin Again (${bet} 🪙)`)
      .setStyle(ButtonStyle.Success)
  );

  return { embed, components: [row], won, winnings, netGain };
}

/**
 * Play Coinflip
 * @param {string} userId 
 * @param {string} username 
 * @param {number} bet 
 * @param {string} choice 'heads' or 'tails'
 */
function playCoinflip(userId, username, bet, choice = 'heads') {
  const profile = getUserProfile(userId);
  if (profile.cash < bet) {
    return { error: `You don't have enough Cowoncy! Your balance: **${profile.cash}** 🪙` };
  }

  addCash(userId, -bet);

  const outcomes = ['heads', 'tails'];
  const result = outcomes[Math.floor(Math.random() * outcomes.length)];
  const won = result.toLowerCase() === choice.toLowerCase();

  const winnings = won ? bet * 2 : 0;
  if (won) addCash(userId, winnings);

  const embed = new EmbedBuilder()
    .setColor(won ? 0x2ecc71 : 0xe74c3c)
    .setTitle(`🪙 **${username}'s Coinflip**`)
    .setDescription(
      `The coin landed on: **${result.toUpperCase()}** ${result === 'heads' ? '👤' : '🦅'}\n` +
      `Your pick: **${choice.toUpperCase()}**\n\n` +
      (won
        ? `🎉 **You won!** You received **+${winnings}** 🪙 Cowoncy!`
        : `💔 **You lost** **${bet}** 🪙 Cowoncy!`)
    )
    .setFooter({ text: `Balance: ${getUserProfile(userId).cash} 🪙` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`cf_again_${userId}_${bet}_${choice}`)
      .setLabel(`Flip Again (${choice.toUpperCase()})`)
      .setStyle(ButtonStyle.Primary)
  );

  return { embed, components: [row], won, winnings };
}

module.exports = {
  playSlots,
  playCoinflip
};
