const chalk = require('chalk');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(chalk.green(`\n==========================================`));
    console.log(chalk.bold.cyan(`  OwO Bot Enhanced is ONLINE!`));
    console.log(chalk.magenta(`  Developer: Senotron`));
    console.log(chalk.green(`  Logged in as: ${client.user.tag}`));
    console.log(chalk.green(`  Serving ${client.guilds.cache.size} server(s)`));
    console.log(chalk.green(`  Database: croxydb (Connected)`));
    console.log(chalk.green(`==========================================\n`));

    // Set bot presence status
    client.user.setPresence({
      activities: [{ name: 'owo help | w h | /hunt 🌿', type: 3 }],
      status: 'online'
    });

    // Register Slash Commands globally or per guild
    try {
      const slashCommands = [];
      client.commands.forEach(cmd => {
        if (cmd.slashData) {
          slashCommands.push(cmd.slashData.toJSON());
        }
      });

      if (slashCommands.length > 0) {
        console.log(chalk.yellow(`Registering ${slashCommands.length} slash commands...`));
        await client.application.commands.set(slashCommands);
        console.log(chalk.green(`Successfully registered ${slashCommands.length} slash commands!`));
      }
    } catch (err) {
      console.error('Failed to register slash commands:', err);
    }
  }
};
