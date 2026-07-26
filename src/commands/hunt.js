const { SlashCommandBuilder } = require('discord.js');
const { performHunt } = require('../systems/huntEngine');

module.exports = {
  name: 'hunt',
  aliases: ['h', 'catch'],
  description: 'Go hunting to catch wild animals and earn Cowoncy & XP!',
  slashData: new SlashCommandBuilder()
    .setName('hunt')
    .setDescription('Go hunting to catch wild animals and earn Cowoncy & XP!'),

  async executeMessage(message, args) {
    try {
      const result = performHunt(message.author.id, message.author.username);
      return message.reply({ embeds: [result.embed], components: result.components });
    } catch (err) {
      console.error('Error in hunt command:', err);
      return message.reply('❌ An error occurred while hunting. Please try again!');
    }
  },

  async executeSlash(interaction) {
    try {
      const result = performHunt(interaction.user.id, interaction.user.username);
      return interaction.reply({ embeds: [result.embed], components: result.components });
    } catch (err) {
      console.error('Error in hunt slash command:', err);
      return interaction.reply({ content: '❌ An error occurred while hunting.', ephemeral: true });
    }
  }
};
