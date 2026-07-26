const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'owoify',
  aliases: ['uwu', 'owoificator'],
  description: 'Translate normal text into cute OwO / UwU speak!',
  slashData: new SlashCommandBuilder()
    .setName('owoify')
    .setDescription('Translate text into OwO speak')
    .addStringOption(opt => opt.setName('text').setDescription('Text to translate').setRequired(true)),

  async executeMessage(message, args) {
    if (!args[0]) return message.reply('❌ Please provide text to owoify! Example: `owo owoify hello world`');
    const text = args.join(' ');
    const translated = owoifyText(text);
    return message.reply(`💬 ${translated}`);
  },

  async executeSlash(interaction) {
    const text = interaction.options.getString('text');
    const translated = owoifyText(text);
    return interaction.reply({ content: `💬 ${translated}` });
  }
};

function owoifyText(text) {
  let str = text
    .replace(/(r|l)/g, 'w')
    .replace(/(R|L)/g, 'W')
    .replace(/n([aeiou])/g, 'ny$1')
    .replace(/N([aeiou])/g, 'Ny$1')
    .replace(/N([AEIOU])/g, 'NY$1')
    .replace(/ove/g, 'uv')
    .replace(/!+/g, ' >w< !');

  const faces = [' OwO', ' UwU', ' >w<', ' ^w^', ' (::^ω^::)', ' 🐾'];
  const randomFace = faces[Math.floor(Math.random() * faces.length)];
  return str + randomFace;
}

module.exports.owoifyText = owoifyText;
