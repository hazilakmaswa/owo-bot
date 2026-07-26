const { PREFIX } = process.env;

module.exports = {
  name: 'messageCreate',
  async execute(client, message) {
    if (message.author.bot || !message.guild) return;

    const content = message.content.trim();
    let commandName = null;
    let args = [];

    // Support 'owo ' prefix, 'w ' prefix, or 'owo' / 'w' prefix
    if (content.toLowerCase().startsWith('owo ')) {
      const parts = content.slice(4).trim().split(/ +/);
      commandName = parts[0].toLowerCase();
      args = parts.slice(1);
    } else if (content.toLowerCase().startsWith('w ')) {
      const parts = content.slice(2).trim().split(/ +/);
      commandName = parts[0].toLowerCase();
      args = parts.slice(1);
    } else if (content.toLowerCase() === 'owo' || content.toLowerCase() === 'w') {
      commandName = 'help';
    }

    if (!commandName) return;

    // Find command by name or alias
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (command && typeof command.executeMessage === 'function') {
      try {
        await command.executeMessage(message, args);
      } catch (err) {
        console.error(`Error executing message command '${commandName}':`, err);
        message.reply('❌ An internal error occurred while executing this command.');
      }
    }
  }
};
