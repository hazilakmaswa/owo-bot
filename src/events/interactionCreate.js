const { performHunt } = require('../systems/huntEngine');
const { playSlots, playCoinflip } = require('../systems/casinoEngine');
const { simulateBattle } = require('../systems/battleEngine');
const { activeGames, sendBlackjackEmbed, calculateScore, drawCard } = require('../commands/blackjack');
const { getUserProfile, removeAnimal, addCash } = require('../database/db');
const { getAnimalById } = require('../systems/animals');

module.exports = {
  name: 'interactionCreate',
  async execute(client, interaction) {
    // 1. Handle Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.executeSlash(interaction);
      } catch (err) {
        console.error(`Error executing slash command '${interaction.commandName}':`, err);
        const replyPayload = { content: '❌ An error occurred while executing this command.', ephemeral: true };
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

      // Extract owner userId from customId (e.g. hunt_again_123456789)
      const parts = customId.split('_');
      const ownerId = parts[2] || parts[1];

      // Security check: Only author can interact
      if (ownerId && ownerId !== interaction.user.id && !['open_shop', 'help'].some(k => customId.startsWith(k))) {
        return interaction.reply({ content: '❌ These interactive controls belong to another player! Use your own command to play.', ephemeral: true });
      }

      try {
        // Hunt Again
        if (customId.startsWith('hunt_again_')) {
          const result = performHunt(interaction.user.id, interaction.user.username);
          return interaction.update({ embeds: [result.embed], components: result.components });
        }

        // View Zoo
        if (customId.startsWith('view_zoo_')) {
          const zooCmd = client.commands.get('zoo');
          return zooCmd.executeSlash(interaction);
        }

        // Spin Slots Again
        if (customId.startsWith('spin_again_')) {
          const bet = parseInt(parts[3]) || 100;
          const result = playSlots(interaction.user.id, interaction.user.username, bet);
          if (result.error) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
          return interaction.update({ embeds: [result.embed], components: result.components });
        }

        // Coinflip Again
        if (customId.startsWith('cf_again_')) {
          const bet = parseInt(parts[3]) || 100;
          const choice = parts[4] || 'heads';
          const result = playCoinflip(interaction.user.id, interaction.user.username, bet, choice);
          if (result.error) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
          return interaction.update({ embeds: [result.embed], components: result.components });
        }

        // Rematch Battle
        if (customId.startsWith('battle_again_') || customId.startsWith('start_battle_')) {
          const result = simulateBattle(interaction.user.id, interaction.user.username);
          return interaction.update({ embeds: [result.embed], components: result.components });
        }

        // Buy Lotto Buttons
        if (customId.startsWith('buy_lotto_')) {
          const count = customId.startsWith('buy_lotto_10_') ? 10 : 1;
          const { buyLotteryTickets } = require('../commands/lottery');
          return buyLotteryTickets(interaction.user.id, interaction.user.username, count, interaction);
        }

        // Blackjack Controls
        if (customId.startsWith('bj_')) {
          const gameState = activeGames.get(interaction.user.id);
          if (!gameState) {
            return interaction.reply({ content: '❌ Game session expired! Start a new game with `owo bj`.', ephemeral: true });
          }

          const action = parts[1];

          if (action === 'hit') {
            gameState.playerHand.push(drawCard(gameState.deck));
            const pScore = calculateScore(gameState.playerHand);

            if (pScore > 21) {
              gameState.status = 'LOST';
              activeGames.delete(interaction.user.id);
              return sendBlackjackEmbed(gameState, `💥 **BUST!** You went over 21 and lost **${gameState.bet}** 🪙 Cowoncy!`, null, interaction, true);
            }
            return sendBlackjackEmbed(gameState, 'You drew a card. Hit or Stand?', null, interaction, false);
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
              statusText = `🎉 **YOU WIN!** Dealer score: ${dScore}. You won **+${winnings}** 🪙 Cowoncy!`;
            } else if (dScore === pScore) {
              gameState.status = 'TIE';
              addCash(interaction.user.id, gameState.bet); // refund
              statusText = `👔 **PUSH / TIE!** Bet of **${gameState.bet}** 🪙 Cowoncy refunded.`;
            } else {
              gameState.status = 'LOST';
              statusText = `💔 **DEALER WINS!** Dealer score: ${dScore}. You lost **${gameState.bet}** 🪙 Cowoncy.`;
            }

            activeGames.delete(interaction.user.id);
            return sendBlackjackEmbed(gameState, statusText, null, interaction, true);
          }

          if (action === 'double') {
            const profile = getUserProfile(interaction.user.id);
            if (profile.cash < gameState.bet) {
              return interaction.reply({ content: '❌ You don\'t have enough Cowoncy to Double Down!', ephemeral: true });
            }

            addCash(interaction.user.id, -gameState.bet);
            gameState.bet *= 2;
            gameState.playerHand.push(drawCard(gameState.deck));

            // Automatically stand after double
            while (calculateScore(gameState.dealerHand) < 17) {
              gameState.dealerHand.push(drawCard(gameState.deck));
            }

            const pScore = calculateScore(gameState.playerHand);
            const dScore = calculateScore(gameState.dealerHand);

            let statusText = '';
            if (pScore > 21) {
              gameState.status = 'LOST';
              statusText = `💥 **BUST!** Score: ${pScore}. Lost **${gameState.bet}** 🪙 Cowoncy!`;
            } else if (dScore > 21 || pScore > dScore) {
              gameState.status = 'WON';
              const winnings = gameState.bet * 2;
              addCash(interaction.user.id, winnings);
              statusText = `🎉 **DOUBLE DOWN WIN!** You won **+${winnings}** 🪙 Cowoncy!`;
            } else if (dScore === pScore) {
              gameState.status = 'TIE';
              addCash(interaction.user.id, gameState.bet);
              statusText = `👔 **PUSH / TIE!** Bet refunded.`;
            } else {
              gameState.status = 'LOST';
              statusText = `💔 **DEALER WINS!** Lost **${gameState.bet}** 🪙 Cowoncy.`;
            }

            activeGames.delete(interaction.user.id);
            return sendBlackjackEmbed(gameState, statusText, null, interaction, true);
          }
        }

        // Sell Duplicates Button
        if (customId.startsWith('zoo_sell_duplicates_')) {
          const profile = getUserProfile(interaction.user.id);
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
            return interaction.reply({ content: '❌ You don\'t have any duplicate animals to sell!', ephemeral: true });
          }

          addCash(interaction.user.id, totalEarned);
          return interaction.reply({ content: `💰 **Sold ${totalSold} duplicate animals** for **+${totalEarned}** 🪙 Cowoncy!`, ephemeral: true });
        }
      } catch (err) {
        console.error('Error handling button interaction:', err);
        return interaction.reply({ content: '❌ An error occurred while processing your action.', ephemeral: true });
      }
    }

    // 3. Handle Select Menu Component Interactions
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('zoo_filter_')) {
        const selectedRarity = interaction.values[0];
        const zooCmd = client.commands.get('zoo');
        // Render updated zoo with filter
        return zooCmd.executeSlash(interaction);
      }
    }
  }
};
