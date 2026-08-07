const { performHunt } = require('../systems/huntEngine');
const { playSlots, playCoinflip } = require('../systems/casinoEngine');
const { simulateBattle } = require('../systems/battleEngine');
const { activeGames, sendBlackjackEmbed, calculateScore, drawCard } = require('../commands/blackjack');
const { getUserProfile, removeAnimal, addCash } = require('../database/db');
const { getAnimalById } = require('../systems/animals');
const { parseButtonId, validateButtonOwnership, extractNumericValue } = require('../utils/buttonParser');

module.exports = {
  name: 'interactionCreate',
  async execute(client, interaction) {
    try {
      // 1. Handle Slash Commands
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
          return interaction.reply({ 
            content: '❌ Command tidak ditemukan!', 
            ephemeral: true 
          });
        }

        try {
          await command.executeSlash(interaction);
        } catch (err) {
          console.error(`❌ Error executing slash command '${interaction.commandName}':`, err);
          const replyPayload = { 
            content: '❌ Terjadi kesalahan saat menjalankan command ini.', 
            ephemeral: true 
          };
          
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(replyPayload);
          } else {
            await interaction.reply(replyPayload);
          }
        }
        return;
      }

      // 2. Handle Button Component Interactions
      if (interaction.isButton()) {
        const customId = interaction.customId;
        const parsed = parseButtonId(customId);

        // Security check: validate ownership (dengan public button exceptions)
        const publicButtons = ['open_shop', 'help', 'buy_lotto'];
        if (!validateButtonOwnership(customId, interaction.user.id, publicButtons)) {
          return interaction.reply({ 
            content: '❌ Kontrol interaktif ini milik player lain! Gunakan command sendiri untuk bermain.', 
            ephemeral: true 
          });
        }

        try {
          // Hunt Again Button
          if (customId.startsWith('hunt_again_')) {
            const result = performHunt(interaction.user.id, interaction.user.username);
            if (!result || !result.embed) {
              return interaction.reply({ 
                content: '❌ Gagal melakukan hunt. Coba lagi!', 
                ephemeral: true 
              });
            }
            return interaction.update({ embeds: [result.embed], components: result.components || [] });
          }

          // View Zoo Button
          if (customId.startsWith('view_zoo_')) {
            const zooCmd = client.commands.get('zoo');
            if (!zooCmd) {
              return interaction.reply({ 
                content: '❌ Perintah zoo tidak tersedia.', 
                ephemeral: true 
              });
            }
            return zooCmd.executeSlash(interaction);
          }

          // Spin Slots Again Button
          if (customId.startsWith('spin_again_')) {
            const bet = extractNumericValue(customId, 3) || 100;
            if (bet <= 0) {
              return interaction.reply({ 
                content: '❌ Bet amount tidak valid.', 
                ephemeral: true 
              });
            }
            
            const result = playSlots(interaction.user.id, interaction.user.username, bet);
            if (result.error) {
              return interaction.reply({ 
                content: `❌ ${result.error}`, 
                ephemeral: true 
              });
            }
            return interaction.update({ embeds: [result.embed], components: result.components || [] });
          }

          // Coinflip Again Button
          if (customId.startsWith('cf_again_')) {
            const bet = extractNumericValue(customId, 3) || 100;
            const choice = parsed.parts[4] || 'heads';
            
            if (bet <= 0 || !['heads', 'tails'].includes(choice)) {
              return interaction.reply({ 
                content: '❌ Data coinflip tidak valid.', 
                ephemeral: true 
              });
            }
            
            const result = playCoinflip(interaction.user.id, interaction.user.username, bet, choice);
            if (result.error) {
              return interaction.reply({ 
                content: `❌ ${result.error}`, 
                ephemeral: true 
              });
            }
            return interaction.update({ embeds: [result.embed], components: result.components || [] });
          }

          // Rematch Battle Button
          if (customId.startsWith('battle_again_') || customId.startsWith('start_battle_')) {
            const result = simulateBattle(interaction.user.id, interaction.user.username);
            if (!result || !result.embed) {
              return interaction.reply({ 
                content: '❌ Gagal memulai battle. Coba lagi!', 
                ephemeral: true 
              });
            }
            return interaction.update({ embeds: [result.embed], components: result.components || [] });
          }

          // Buy Lotto Tickets Button
          if (customId.startsWith('buy_lotto_')) {
            const count = customId.startsWith('buy_lotto_10_') ? 10 : 1;
            const { buyLotteryTickets } = require('../commands/lottery');
            
            if (typeof buyLotteryTickets !== 'function') {
              return interaction.reply({ 
                content: '❌ Fungsi lottery tidak tersedia.', 
                ephemeral: true 
              });
            }
            
            return buyLotteryTickets(interaction.user.id, interaction.user.username, count, interaction);
          }

          // Blackjack Controls
          if (customId.startsWith('bj_')) {
            const gameState = activeGames.get(interaction.user.id);
            if (!gameState) {
              return interaction.reply({ 
                content: '❌ Session game sudah expired! Mulai game baru dengan `/blackjack`.', 
                ephemeral: true 
              });
            }

            const action = parsed.parts[1];

            if (action === 'hit') {
              gameState.playerHand.push(drawCard(gameState.deck));
              const pScore = calculateScore(gameState.playerHand);

              if (pScore > 21) {
                gameState.status = 'LOST';
                activeGames.delete(interaction.user.id);
                return sendBlackjackEmbed(gameState, `💥 **BUST!** Anda over 21 dan kalah **${gameState.bet}** 🪙 Cowoncy!`, null, interaction, true);
              }
              return sendBlackjackEmbed(gameState, 'Anda draw kartu. Hit atau Stand?', null, interaction, false);
            }

            if (action === 'stand') {
              // Dealer turn
              while (calculateScore(gameState.dealerHand) < 17) {
                gameState.dealerHand.push(drawCard(gameState.deck));
              }
              const pScore = calculateScore(gameState.playerHand);
              const dScore = calculateScore(gameState.dealerHand);

              let statusText = '';
              if (dScore > 21 || pScore > dScore) {
                gameState.status = 'WON';
                const winnings = gameState.bet * 2;
                addCash(interaction.user.id, winnings);
                statusText = `🎉 **MENANG!** Dealer score: ${dScore}. Anda menang **+${winnings}** 🪙 Cowoncy!`;
              } else if (dScore === pScore) {
                gameState.status = 'TIE';
                addCash(interaction.user.id, gameState.bet);
                statusText = `👔 **PUSH / SERI!** Bet **${gameState.bet}** 🪙 Cowoncy di-refund.`;
              } else {
                gameState.status = 'LOST';
                statusText = `💔 **DEALER MENANG!** Dealer score: ${dScore}. Anda kalah **${gameState.bet}** 🪙 Cowoncy.`;
              }

              activeGames.delete(interaction.user.id);
              return sendBlackjackEmbed(gameState, statusText, null, interaction, true);
            }

            if (action === 'double') {
              const profile = getUserProfile(interaction.user.id);
              if (!profile || profile.cash < gameState.bet) {
                return interaction.reply({ 
                  content: '❌ Anda tidak punya cukup Cowoncy untuk Double Down!', 
                  ephemeral: true 
                });
              }

              addCash(interaction.user.id, -gameState.bet);
              gameState.bet *= 2;
              gameState.playerHand.push(drawCard(gameState.deck));

              // Automatically stand setelah double
              while (calculateScore(gameState.dealerHand) < 17) {
                gameState.dealerHand.push(drawCard(gameState.deck));
              }

              const pScore = calculateScore(gameState.playerHand);
              const dScore = calculateScore(gameState.dealerHand);

              let statusText = '';
              if (pScore > 21) {
                gameState.status = 'LOST';
                statusText = `💥 **BUST!** Score: ${pScore}. Kalah **${gameState.bet}** 🪙 Cowoncy!`;
              } else if (dScore > 21 || pScore > dScore) {
                gameState.status = 'WON';
                const winnings = gameState.bet * 2;
                addCash(interaction.user.id, winnings);
                statusText = `🎉 **DOUBLE DOWN MENANG!** Anda menang **+${winnings}** 🪙 Cowoncy!`;
              } else if (dScore === pScore) {
                gameState.status = 'TIE';
                addCash(interaction.user.id, gameState.bet);
                statusText = `👔 **PUSH / SERI!** Bet di-refund.`;
              } else {
                gameState.status = 'LOST';
                statusText = `💔 **DEALER MENANG!** Kalah **${gameState.bet}** 🪙 Cowoncy.`;
              }

              activeGames.delete(interaction.user.id);
              return sendBlackjackEmbed(gameState, statusText, null, interaction, true);
            }

            // Jika action tidak dikenali
            return interaction.reply({ 
              content: '❌ Aksi blackjack tidak dikenali!', 
              ephemeral: true 
            });
          }

          // Sell Duplicates Button
          if (customId.startsWith('zoo_sell_duplicates_')) {
            const profile = getUserProfile(interaction.user.id);
            if (!profile || !profile.zoo) {
              return interaction.reply({ 
                content: '❌ Data zoo Anda tidak ditemukan!', 
                ephemeral: true 
              });
            }

            let totalEarned = 0;
            let totalSold = 0;

            for (const animalId in profile.zoo) {
              const count = profile.zoo[animalId];
              if (count > 1) {
                const duplicates = count - 1;
                const animal = getAnimalById(animalId);
                if (animal) {
                  const value = (animal.rarity === 'COMMON' ? 20 : 50) * duplicates;
                  totalEarned += value;
                  totalSold += duplicates;
                  removeAnimal(interaction.user.id, animalId, duplicates);
                }
              }
            }

            if (totalSold === 0) {
              return interaction.reply({ 
                content: '❌ Anda tidak punya animal duplikat untuk dijual!', 
                ephemeral: true 
              });
            }

            addCash(interaction.user.id, totalEarned);
            return interaction.reply({ 
              content: `💰 **Terjual ${totalSold} animal duplikat** untuk **+${totalEarned}** 🪙 Cowoncy!`, 
              ephemeral: true 
            });
          }

          // Unhandled button
          console.warn(`⚠️ Unknown button interaction: ${customId}`);
          return interaction.reply({ 
            content: '❌ Button ini tidak dikenal atau sudah kadaluarsa.', 
            ephemeral: true 
          });

        } catch (err) {
          console.error(`❌ Error handling button interaction '${customId}':`, err);
          return interaction.reply({ 
            content: '❌ Terjadi kesalahan saat memproses aksi Anda.', 
            ephemeral: true 
          });
        }
      }

      // 3. Handle Select Menu Component Interactions
      if (interaction.isStringSelectMenu()) {
        try {
          if (interaction.customId.startsWith('zoo_filter_')) {
            const selectedRarity = interaction.values[0];
            const zooCmd = client.commands.get('zoo');
            
            if (!zooCmd) {
              return interaction.reply({ 
                content: '❌ Perintah zoo tidak tersedia.', 
                ephemeral: true 
              });
            }

            return zooCmd.executeSlash(interaction);
          }

          // Unhandled select menu
          console.warn(`⚠️ Unknown select menu: ${interaction.customId}`);
          return interaction.reply({ 
            content: '❌ Select menu ini tidak dikenal.', 
            ephemeral: true 
          });

        } catch (err) {
          console.error(`❌ Error handling select menu interaction:`, err);
          return interaction.reply({ 
            content: '❌ Terjadi kesalahan saat memproses pilihan Anda.', 
            ephemeral: true 
          });
        }
      }

    } catch (globalErr) {
      console.error(`❌ Critical error in interactionCreate handler:`, globalErr);
    }
  }
};
