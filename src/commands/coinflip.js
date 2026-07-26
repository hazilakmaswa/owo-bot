const { SlashCommandBuilder } = require('discord.js');
const { playCoinflip } = require('../systems/casinoEngine');

module.exports = {
  name: 'coinflip',
  aliases: ['cf', 'flip'],
  description: 'Bet Cowoncy on a coinflip (heads or tails).',
  slashData: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin for Cowoncy')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to bet').setRequired(false))
    .addStringOption(opt => opt.setName('choice').setDescription('Heads or Tails').addChoices(
      { name: 'Heads', value: 'heads' },
      { name: 'Tails', value: 'tails' }
    )),

  async executeMessage(message, args) {
    let bet = 100;
    let choice = 'heads';

    if (args[0] && !isNaN(args[0])) {
      bet = Math.max(10, Math.min(100000, parseInt(args[0])));
    }
    if (args[1] && ['heads', 'h', 'tails', 't'].includes(args[1].toLowerCase())) {
      choice = args[1].toLowerCase().startsWith('h') ? 'heads' : 'tails';
    }

    const result = playCoinflip(message.author.id, message.author.username, bet, choice);
    if (result.error) return message.reply(`❌ ${result.error}`);

    return message.reply({ embeds: [result.embed], components: result.components });
  },

  async executeSlash(interaction) {
    const bet = interaction.options.getInteger('amount') || 100;
    const choice = interaction.options.getString('choice') || 'heads';

    const result = playCoinflip(interaction.user.id, interaction.user.username, bet, choice);
    if (result.error) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });

    return interaction.reply({ embeds: [result.embed], components: result.components });
  }
};
