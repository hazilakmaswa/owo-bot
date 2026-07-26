const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'stats',
  aliases: ['ping', 'botinfo', 'info'],
  description: 'Display bot status, latency, uptime, and system statistics.',
  slashData: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Display bot status and latency'),

  async executeMessage(message, args) {
    return sendStats(message.client, message);
  },

  async executeSlash(interaction) {
    return sendStats(interaction.client, null, interaction);
  }
};

function sendStats(client, messageObj = null, interactionObj = null) {
  const ping = client.ws.ping;
  const uptimeSeconds = Math.floor(client.uptime / 1000);
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('🤖 **OwO Bot Enhanced - System Statistics**')
    .addFields(
      { name: '🏓 WebSocket Ping', value: `\`${ping}ms\``, inline: true },
      { name: '⏱️ Uptime', value: `\`${hours}h ${minutes}m ${seconds}s\``, inline: true },
      { name: '💾 Memory Usage', value: `\`${memoryUsage} MB\``, inline: true },
      { name: '🌐 Guilds Served', value: `\`${client.guilds.cache.size}\``, inline: true },
      { name: '👥 Total Users', value: `\`${client.users.cache.size}\``, inline: true },
      { name: '👨‍💻 Developer', value: '`Senotron`', inline: true }
    )
    .setFooter({ text: 'Powered by Discord.js v14 & croxydb' })
    .setTimestamp();

  const payload = { embeds: [embed] };
  return interactionObj ? interactionObj.reply(payload) : messageObj.reply(payload);
}
