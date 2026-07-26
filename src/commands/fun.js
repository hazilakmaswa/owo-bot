const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'fun',
  aliases: ['8ball', 'roll', 'pick', 'choose'],
  description: 'Fun mini-tools: 8ball, dice roll, or random choice picker.',
  slashData: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll a random die (1-100)')
    .addIntegerOption(opt => opt.setName('max').setDescription('Maximum number (default 100)').setRequired(false)),

  async executeMessage(message, args) {
    const commandName = message.content.split(' ')[1] || 'roll';
    const sub = commandName.toLowerCase();

    if (sub === '8ball') {
      if (!args[0]) return message.reply('🎱 Ask a question! Example: `owo 8ball Will I catch a legendary animal?`');
      const answers = [
        'It is certain! ✨',
        'Without a doubt! 🌟',
        'Yes - definitely! 👍',
        'Ask again later... 🔮',
        'Better not tell you now. 🤫',
        'My sources say no. 👎',
        'Very doubtful. ☁️'
      ];
      const answer = answers[Math.floor(Math.random() * answers.length)];
      return message.reply(`🎱 **8-Ball:** ${answer}`);
    }

    if (sub === 'pick' || sub === 'choose') {
      if (args.length < 2) return message.reply('❌ Please provide at least two choices separated by spaces or commas! Example: `owo pick cat dog`');
      const choices = args.join(' ').split(/[,|]/).flatMap(c => c.trim().split(/ +/));
      const picked = choices[Math.floor(Math.random() * choices.length)];
      return message.reply(`🤔 I pick: **${picked}**!`);
    }

    // Default: Roll
    let max = 100;
    if (args[0] && !isNaN(args[0])) max = Math.max(2, parseInt(args[0]));
    const roll = Math.floor(Math.random() * max) + 1;
    return message.reply(`🎲 **${message.author.username}** rolled a **${roll}** (1-${max})!`);
  },

  async executeSlash(interaction) {
    const max = interaction.options.getInteger('max') || 100;
    const roll = Math.floor(Math.random() * max) + 1;
    return interaction.reply({ content: `🎲 **${interaction.user.username}** rolled a **${roll}** (1-${max})!` });
  }
};
