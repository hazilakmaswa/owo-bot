const { PREFIX } = process.env;

module.exports = {
  name: 'messageCreate',
  async execute(client, message) {
    // Filter: abaikan bot messages dan non-guild messages
    if (message.author.bot || !message.guild) return;

    const content = message.content.trim();
    let commandName = null;
    let args = [];

    // Support 'fowo ' prefix, 'f ' prefix, atau 'fowo' / 'f' solo
    if (content.toLowerCase().startsWith('fowo ')) {
      const parts = content.slice(5).trim().split(/ +/);
      commandName = parts[0].toLowerCase();
      args = parts.slice(1);
    } else if (content.toLowerCase().startsWith('f ')) {
      const parts = content.slice(2).trim().split(/ +/);
      commandName = parts[0].toLowerCase();
      args = parts.slice(1);
    } else if (content.toLowerCase() === 'fowo' || content.toLowerCase() === 'f') {
      commandName = 'help';
    }

    // Jika tidak ada command name, skip
    if (!commandName) return;

    // Find command by name atau aliases
    const command = client.commands.get(commandName) || 
                    client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    // Execute command jika ditemukan dan memiliki method executeMessage
    if (command && typeof command.executeMessage === 'function') {
      try {
        await command.executeMessage(message, args);
      } catch (err) {
        console.error(`❌ Error executing message command '${commandName}':`, err);
        message.reply({ content: '❌ Terjadi kesalahan saat menjalankan command ini.', ephemeral: true });
      }
    }
  }
};
