const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  aliases: ['h', 'commands'],
  description: 'Display OwO bot command guide and information.',
  slashData: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display OwO bot help menu'),

  async executeMessage(message, args) {
    return sendHelp(message.author.username, message);
  },

  async executeSlash(interaction) {
    return sendHelp(interaction.user.username, null, interaction);
  }
};

function sendHelp(username, messageObj = null, interactionObj = null) {
  const embed = new EmbedBuilder()
    .setColor(0x00ffff)
    .setTitle('🌟 **OwO Bot Enhanced - Help Center**')
    .setDescription(
      `Welcome **${username}**! Here is the full list of available command categories.\n` +
      `You can use both **Prefix** (\`owo hunt\`, \`w h\`, \`owo slots\`) and **Slash Commands** (\`/hunt\`, \`/zoo\`).`
    )
    .addFields(
      {
        name: '🌿 **Hunting & Zoo**',
        value: '`owo hunt` (`w h`) - Hunt wild animals\n`owo zoo` (`w z`) - View your animal collection\n`owo sell <animal>` - Sell animals for Cowoncy\n`owo sac <animal>` - Sacrifice animals for Essence'
      },
      {
        name: '⚔️ **Pet RPG Battles**',
        value: '`owo battle` (`w b`) - Battle against wild bosses\n`owo team <a1> <a2> <a3>` - Customize your 3-pet battle team'
      },
      {
        name: '🎰 **Casino & Gambling**',
        value: '`owo slots <bet>` (`w s`) - Spin the slot machine\n`owo coinflip <bet> <h/t>` (`w cf`) - Flip coins\n`owo blackjack <bet>` (`w bj`) - Play card Blackjack'
      },
      {
        name: '🪙 **Economy & Items**',
        value: '`owo cash` - View your balance\n`owo daily` - Claim 24h reward & streak\n`owo pray` / `curse` - Bless or curse users\n`owo inv` / `shop` / `buy` / `use` - Manage items & lootboxes'
      },
      {
        name: '👤 **Social & Quests**',
        value: '`owo profile` - View your RPG card\n`owo quest` - View daily challenges\n`owo marry @user` - Propose with a Diamond Ring\n`owo leaderboard` - Global top riches'
      }
    )
    .setFooter({ text: 'Powered by Discord.js v14 & croxydb | Developer: Senotron' })
    .setTimestamp();

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('help_category_select')
    .setPlaceholder('Explore Command Categories...')
    .addOptions([
      { label: 'Overview & Main', value: 'help_main', emoji: '🌟' },
      { label: 'Hunting & Zoo System', value: 'help_zoo', emoji: '🌿' },
      { label: 'Pet RPG Battles', value: 'help_battle', emoji: '⚔️' },
      { label: 'Casino & Games', value: 'help_casino', emoji: '🎰' },
      { label: 'Economy & Shop', value: 'help_economy', emoji: '🪙' }
    ]);

  const row = new ActionRowBuilder().addComponents(selectMenu);
  const payload = { embeds: [embed], components: [row] };

  return interactionObj ? interactionObj.reply(payload) : messageObj.reply(payload);
}
