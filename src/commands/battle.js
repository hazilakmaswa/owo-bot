const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { simulateBattle } = require('../systems/battleEngine');
const { getUserProfile, saveUserProfile } = require('../database/db');
const { getAnimalById } = require('../systems/animals');

module.exports = {
  name: 'battle',
  aliases: ['b', 'ab', 'team'],
  description: 'Battle with your animal team or set up your battle squad.',
  slashData: new SlashCommandBuilder()
    .setName('battle')
    .setDescription('Battle with your animal team'),

  async executeMessage(message, args) {
    const commandName = message.content.split(' ')[1] || 'battle';

    if (args[0] === 'team' || commandName === 'team') {
      return handleTeam(message.author.id, message.author.username, args.slice(1), message);
    }

    try {
      const result = simulateBattle(message.author.id, message.author.username);
      return message.reply({ embeds: [result.embed], components: result.components });
    } catch (err) {
      console.error('Error in battle command:', err);
      return message.reply('❌ An error occurred during battle. Make sure you have animals in your zoo!');
    }
  },

  async executeSlash(interaction) {
    try {
      const result = simulateBattle(interaction.user.id, interaction.user.username);
      return interaction.reply({ embeds: [result.embed], components: result.components });
    } catch (err) {
      console.error('Error in battle slash command:', err);
      return interaction.reply({ content: '❌ Battle failed to launch.', ephemeral: true });
    }
  }
};

function handleTeam(userId, username, args, messageObj) {
  const profile = getUserProfile(userId);

  if (args.length > 0) {
    // Setting new team animals e.g., owo team wolf dragon tiger
    const newTeam = [];
    for (const rawName of args.slice(0, 3)) {
      const animal = getAnimalById(rawName.toLowerCase());
      if (animal && profile.zoo[animal.id] > 0) {
        newTeam.push(animal.id);
      }
    }

    if (newTeam.length === 0) {
      return messageObj.reply('❌ None of those animals were found in your Zoo! Catch them first with `owo hunt`.');
    }

    profile.team = newTeam;
    saveUserProfile(userId, profile);

    const teamDisplay = newTeam.map(id => {
      const a = getAnimalById(id);
      return `${a.emoji} **${a.name}**`;
    }).join(' | ');

    return messageObj.reply(`⚔️ **Battle Team Updated!** Your active squad: ${teamDisplay}`);
  }

  // Display current team
  const currentTeam = profile.team && profile.team.length > 0 ? profile.team : ['cat', 'dog', 'mouse'];
  const teamList = currentTeam.map((id, index) => {
    const a = getAnimalById(id) || getAnimalById('cat');
    return `**Slot ${index + 1}:** ${a.emoji} **${a.name}** (${a.rarity}) - HP: ${a.hp} | ATK: ${a.atk} | DEF: ${a.def}`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle(`🛡️ **${username}'s Pet Battle Squad**`)
    .setDescription(
      `Here is your active combat squad:\n\n${teamList}\n\n` +
      `*To change your team, use:* \`owo team <animal1> <animal2> <animal3>\`\n*Example:* \`owo team dragon wolf tiger\``
    )
    .setFooter({ text: 'Battle beasts receive stats bonuses during combat!' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`start_battle_${userId}`)
      .setLabel('Start Battle ⚔️')
      .setStyle(ButtonStyle.Danger)
  );

  return messageObj.reply({ embeds: [embed], components: [row] });
}
