const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getAnimalById, RARITIES } = require('./animals');
const { getUserProfile, addCash, addXp } = require('../database/db');

/**
 * Simulate turn-based battle between player team and opponent team
 * @param {string} userId 
 * @param {string} username 
 * @returns {object} { embed, components, won, rewards }
 */
function simulateBattle(userId, username) {
  const profile = getUserProfile(userId);
  const teamIds = profile.team && profile.team.length > 0 ? profile.team : ['cat', 'dog', 'mouse'];

  // Resolve team stats
  let playerTeam = teamIds.map(id => getAnimalById(id) || getAnimalById('cat')).map(a => ({ ...a, currentHp: a.hp }));

  // Generate Wild Boss Opponent Team based on player level
  const bossTier = profile.level > 10 ? 'LEGENDARY' : profile.level > 5 ? 'EPIC' : 'RARE';
  const bossAnimal = getAnimalById(bossTier === 'LEGENDARY' ? 'frost_dragon' : bossTier === 'EPIC' ? 'dragon' : 'wolf');
  let enemyTeam = [
    { ...bossAnimal, name: `Wild Boss ${bossAnimal.name}`, currentHp: bossAnimal.hp }
  ];

  const logs = [];
  let turn = 1;
  let playerAlive = true;

  // Simple automated RPG combat loop
  while (turn <= 10 && playerTeam.some(p => p.currentHp > 0) && enemyTeam.some(e => e.currentHp > 0)) {
    const activePlayerPet = playerTeam.find(p => p.currentHp > 0);
    const activeEnemyPet = enemyTeam.find(e => e.currentHp > 0);

    if (!activePlayerPet || !activeEnemyPet) break;

    // Player attacks Enemy
    const pDmg = Math.max(10, Math.floor(activePlayerPet.atk * (100 / (100 + activeEnemyPet.def))));
    activeEnemyPet.currentHp -= pDmg;
    logs.push(`Round ${turn}: ${activePlayerPet.emoji} **${activePlayerPet.name}** dealt **${pDmg}** DMG to ${activeEnemyPet.emoji} **${activeEnemyPet.name}**!`);

    if (activeEnemyPet.currentHp <= 0) {
      logs.push(`☠️ ${activeEnemyPet.emoji} **${activeEnemyPet.name}** was defeated!`);
      break;
    }

    // Enemy counter-attacks Player
    const eDmg = Math.max(8, Math.floor(activeEnemyPet.atk * (100 / (100 + activePlayerPet.def))));
    activePlayerPet.currentHp -= eDmg;
    logs.push(`⚡ ${activeEnemyPet.emoji} **${activeEnemyPet.name}** counter-attacked for **${eDmg}** DMG!`);

    if (activePlayerPet.currentHp <= 0) {
      logs.push(`💔 ${activePlayerPet.emoji} **${activePlayerPet.name}** fainted!`);
    }

    turn++;
  }

  const won = enemyTeam.every(e => e.currentHp <= 0);
  let cashReward = 0;
  let xpReward = 0;

  if (won) {
    cashReward = Math.floor(Math.random() * 200) + 100;
    xpReward = Math.floor(Math.random() * 50) + 30;
    addCash(userId, cashReward);
    addXp(userId, xpReward);
  }

  const embed = new EmbedBuilder()
    .setColor(won ? 0x2ecc71 : 0xe74c3c)
    .setTitle(won ? `⚔️ Victory! ${username} Won the Battle!` : `⚔️ Defeat! ${username} Lost the Battle`)
    .setDescription(
      `**Battle Combat Logs:**\n` +
      logs.slice(-5).join('\n') +
      `\n\n` +
      (won
        ? `🎁 **Victory Rewards:** +${cashReward} 🪙 Cowoncy | +${xpReward} ✨ XP`
        : `💔 Your team needs stronger animals or higher level stats! Use \`owo team\` to adjust your squad.`)
    )
    .setFooter({ text: `Team Size: ${playerTeam.length} Animals | Level ${profile.level}` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`battle_again_${userId}`)
      .setLabel('Rematch ⚔️')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`view_team_${userId}`)
      .setLabel('My Team 🛡️')
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    embed,
    components: [row],
    won,
    cashReward,
    xpReward
  };
}

module.exports = {
  simulateBattle
};
