const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  aliases: ['h', 'commands'],
  description: 'Display FowO bot command guide and information.',
  slashData: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Tampilkan FowO bot help menu'),

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
    .setTitle('🌟 **FowO Bot Enhanced - Help Center**')
    .setDescription(
      `Welcome **${username}**! Berikut adalah daftar kategori command lengkap.\n` +
      `Anda bisa menggunakan **Prefix** (\`fowo hunt\`, \`f h\`, \`fowo slots\`) dan **Slash Commands** (\`/hunt\`, \`/zoo\`).`
    )
    .addFields(
      {
        name: '🌿 **Hunting & Zoo**',
        value: '`fowo hunt` (`f h`) - Berburu animal liar\n`fowo zoo` (`f z`) - Lihat koleksi animal\n`fowo sell <animal>` - Jual animal untuk Cowoncy\n`fowo sac <animal>` - Korbankan animal untuk Essence'
      },
      {
        name: '⚔️ **Pet RPG Battles**',
        value: '`fowo battle` (`f b`) - Bertarung melawan boss\n`fowo team <a1> <a2> <a3>` - Atur 3 animal battle team'
      },
      {
        name: '🎰 **Casino & Gambling**',
        value: '`fowo slots <bet>` (`f s`) - Spin slot machine\n`fowo coinflip <bet> <h/t>` (`f cf`) - Flip coin\n`fowo blackjack <bet>` (`f bj`) - Main card Blackjack'
      },
      {
        name: '🪙 **Economy & Items**',
        value: '`fowo cash` - Lihat balance\n`fowo daily` - Claim reward 24h & streak\n`fowo pray` / `curse` - Bless atau curse users\n`fowo inv` / `shop` / `buy` / `use` - Manage items & lootboxes'
      },
      {
        name: '👤 **Social & Quests**',
        value: '`fowo profile` - Lihat RPG card\n`fowo quest` - Lihat daily challenges\n`fowo marry @user` - Propose dengan Diamond Ring\n`fowo leaderboard` - Global top riches'
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
