const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserProfile, addCash } = require('../database/db');

// In-memory active games map
const activeGames = new Map();

module.exports = {
  name: 'blackjack',
  aliases: ['bj'],
  description: 'Play an interactive card game of Blackjack against the dealer.',
  slashData: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Play Blackjack against the dealer')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Bet amount').setRequired(false)),

  async executeMessage(message, args) {
    let bet = 100;
    if (args[0] && !isNaN(args[0])) {
      bet = Math.max(10, Math.min(100000, parseInt(args[0])));
    }
    return startBlackjack(message.author.id, message.author.username, bet, message);
  },

  async executeSlash(interaction) {
    const bet = interaction.options.getInteger('amount') || 100;
    return startBlackjack(interaction.user.id, interaction.user.username, bet, null, interaction);
  }
};

function startBlackjack(userId, username, bet, messageObj = null, interactionObj = null) {
  const profile = getUserProfile(userId);
  if (profile.cash < bet) {
    const msg = `❌ You don't have enough Cowoncy! Your balance: **${profile.cash}** 🪙`;
    return interactionObj ? interactionObj.reply({ content: msg, ephemeral: true }) : messageObj.reply(msg);
  }

  // Deduct initial bet
  addCash(userId, -bet);

  const deck = createDeck();
  const playerHand = [drawCard(deck), drawCard(deck)];
  const dealerHand = [drawCard(deck), drawCard(deck)];

  const gameState = {
    userId,
    username,
    bet,
    deck,
    playerHand,
    dealerHand,
    status: 'IN_PROGRESS'
  };

  activeGames.set(userId, gameState);

  const pScore = calculateScore(playerHand);
  if (pScore === 21) {
    // Natural Blackjack
    gameState.status = 'WON';
    const winnings = Math.floor(bet * 2.5);
    addCash(userId, winnings);
    return sendBlackjackEmbed(gameState, `🎉 **NATURAL BLACKJACK!** You won **+${winnings}** 🪙 Cowoncy!`, messageObj, interactionObj, true);
  }

  return sendBlackjackEmbed(gameState, 'Choose your move:', messageObj, interactionObj, false);
}

function sendBlackjackEmbed(gameState, statusText, messageObj, interactionObj, isFinished = false) {
  const { userId, username, bet, playerHand, dealerHand } = gameState;

  const pScore = calculateScore(playerHand);
  const dScore = isFinished ? calculateScore(dealerHand) : calculateScore([dealerHand[0]]);

  const dealerDisplay = isFinished
    ? dealerHand.map(c => `${c.value}${c.suit}`).join(' ') + ` (Score: **${dScore}**) `
    : `${dealerHand[0].value}${dealerHand[0].suit} 🂠 (Score: **${dScore}**)`;

  const playerDisplay = playerHand.map(c => `${c.value}${c.suit}`).join(' ') + ` (Score: **${pScore}**)`;

  const embed = new EmbedBuilder()
    .setColor(isFinished ? (gameState.status === 'WON' ? 0x2ecc71 : 0xe74c3c) : 0x3498db)
    .setTitle(`🃏 **${username}'s Blackjack Table**`)
    .setDescription(
      `**Dealer's Hand:**\n${dealerDisplay}\n\n` +
      `**Your Hand:**\n${playerDisplay}\n\n` +
      `**${statusText}**`
    )
    .setFooter({ text: `Bet: ${bet} 🪙 | Balance: ${getUserProfile(userId).cash} 🪙` })
    .setTimestamp();

  const components = [];
  if (!isFinished) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`bj_hit_${userId}`).setLabel('Hit 🃏').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`bj_stand_${userId}`).setLabel('Stand 🛑').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`bj_double_${userId}`).setLabel('Double Down 💵').setStyle(ButtonStyle.Warning)
    );
    components.push(row);
  }

  const payload = { embeds: [embed], components };

  if (interactionObj) {
    if (interactionObj.replied || interactionObj.deferred) {
      return interactionObj.editReply(payload);
    }
    return interactionObj.reply(payload);
  }
  return messageObj.reply(payload);
}

function createDeck() {
  const suits = ['♠️', '♥️', '♦️', '♣️'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  for (const s of suits) {
    for (const v of values) {
      deck.push({ suit: s, value: v });
    }
  }
  return shuffle(deck);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function drawCard(deck) {
  return deck.pop() || { suit: '♠️', value: '10' };
}

function calculateScore(hand) {
  let score = 0;
  let aces = 0;
  for (const card of hand) {
    if (card.value === 'A') {
      aces += 1;
      score += 11;
    } else if (['K', 'Q', 'J'].includes(card.value)) {
      score += 10;
    } else {
      score += parseInt(card.value);
    }
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
}

module.exports.activeGames = activeGames;
module.exports.sendBlackjackEmbed = sendBlackjackEmbed;
module.exports.calculateScore = calculateScore;
module.exports.drawCard = drawCard;
