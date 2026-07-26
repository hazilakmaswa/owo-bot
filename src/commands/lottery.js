const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('croxydb');
const { getUserProfile, addCash } = require('../database/db');

module.exports = {
  name: 'lottery',
  aliases: ['lotto', 'ticket'],
  description: 'Participate in the global Cowoncy lottery jackpot pool!',
  slashData: new SlashCommandBuilder()
    .setName('lottery')
    .setDescription('Check or buy tickets for the lottery jackpot'),

  async executeMessage(message, args) {
    if (args[0] && (args[0].toLowerCase() === 'buy' || !isNaN(args[0]))) {
      const tickets = args[1] && !isNaN(args[1]) ? parseInt(args[1]) : (!isNaN(args[0]) ? parseInt(args[0]) : 1);
      return buyLotteryTickets(message.author.id, message.author.username, tickets, message);
    }
    return displayLottery(message.author.id, message.author.username, message);
  },

  async executeSlash(interaction) {
    return displayLottery(interaction.user.id, interaction.user.username, null, interaction);
  }
};

function getLotteryData() {
  let lotto = db.get('global_lottery');
  if (!lotto) {
    lotto = {
      pot: 50000,
      ticketPrice: 100,
      tickets: {}, // userId: ticketCount
      totalTickets: 0,
      drawTime: Date.now() + (24 * 60 * 60 * 1000)
    };
    db.set('global_lottery', lotto);
  }
  return lotto;
}

function displayLottery(userId, username, messageObj = null, interactionObj = null) {
  const lotto = getLotteryData();
  const userTickets = lotto.tickets[userId] || 0;
  const userWinChance = lotto.totalTickets > 0 ? ((userTickets / lotto.totalTickets) * 100).toFixed(2) : '0.00';

  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle('🎰 **OwO Global Lottery Jackpot**')
    .setDescription(
      `Current Jackpot Pool: **${lotto.pot.toLocaleString()}** 🪙 Cowoncy!\n` +
      `Ticket Price: **${lotto.ticketPrice}** 🪙 | Total Tickets Sold: **${lotto.totalTickets.toLocaleString()}**\n\n` +
      `Your Tickets: **${userTickets}** | Win Chance: **${userWinChance}%**\n\n` +
      `*To buy tickets:* \`owo lotto buy <count>\` or click the button below!`
    )
    .setFooter({ text: 'Jackpot drawn automatically every 24 hours!' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`buy_lotto_1_${userId}`)
      .setLabel('Buy 1 Ticket (100 🪙)')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`buy_lotto_10_${userId}`)
      .setLabel('Buy 10 Tickets (1,000 🪙)')
      .setStyle(ButtonStyle.Primary)
  );

  const payload = { embeds: [embed], components: [row] };
  return interactionObj ? interactionObj.reply(payload) : messageObj.reply(payload);
}

function buyLotteryTickets(userId, username, count, messageObj) {
  if (count <= 0) count = 1;
  const lotto = getLotteryData();
  const totalCost = count * lotto.ticketPrice;

  const profile = getUserProfile(userId);
  if (profile.cash < totalCost) {
    return messageObj.reply(`❌ You don't have enough Cowoncy! Cost for **${count}** ticket(s): **${totalCost}** 🪙 | Your Balance: **${profile.cash}** 🪙`);
  }

  addCash(userId, -totalCost);
  lotto.pot += Math.floor(totalCost * 0.9); // 90% goes to pot
  lotto.tickets[userId] = (lotto.tickets[userId] || 0) + count;
  lotto.totalTickets += count;

  db.set('global_lottery', lotto);

  return messageObj.reply(`🎉 **${username}** bought **${count}** lottery ticket(s) for **${totalCost}** 🪙! Current Jackpot: **${lotto.pot.toLocaleString()}** 🪙!`);
}

module.exports.buyLotteryTickets = buyLotteryTickets;
