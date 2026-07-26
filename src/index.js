require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Initialize Discord Client with necessary Gateway Intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// Dynamically load command files from src/commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if (command.name) {
      client.commands.set(command.name, command);
      console.log(chalk.blue(`Loaded command: ${command.name}`));
    }
  }
}

// Dynamically load event files from src/events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(client, ...args));
    } else {
      client.on(event.name, (...args) => event.execute(client, ...args));
    }
    console.log(chalk.magenta(`Loaded event: ${event.name}`));
  }
}

// Global process error catchers to prevent crash
process.on('unhandledRejection', error => {
  console.error(chalk.red('Unhandled Rejection Error:'), error);
});

process.on('uncaughtException', error => {
  console.error(chalk.red('Uncaught Exception Error:'), error);
});

// Login Discord Bot
const token = process.env.DISCORD_TOKEN;
if (!token || token === 'your_bot_token_here') {
  console.log(chalk.yellow('\n⚠️ DISCORD_TOKEN is missing or set to placeholder in .env file!'));
  console.log(chalk.cyan('👉 Please update your .env file with your Discord Bot Token to connect online.'));
} else {
  client.login(token).catch(err => {
    console.error(chalk.red('Failed to login to Discord:'), err.message);
  });
}

module.exports = client;
