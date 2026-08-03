/*
 * Ported from Discord-OwO-Bot (Christopher Thai) - licensed under CC BY-NC-SA 4.0
 * Original: https://github.com/hazilakmaswa/Discord-OwO-Bot
 * Adapted for owo-bot: storage switched from MySQL to croxydb and integrations adjusted.
 */

const CommandInterface = require('../../CommandInterface.js');
const db = require('../../../database/db');
const { v4: uuidv4 } = require('uuid');

module.exports = new CommandInterface({
	alias: ['battle', 'b', 'fight'],
	args: '[challenge|accept|decline|team] <user>',
	desc: 'Battle system: challenge users, accept/decline, manage team',
	example: ['battle challenge @user', 'battle accept <id>', 'battle team set <a1> <a2> <a3>'],
	permissions: ['sendMessages', 'embedLinks'],
	group: ['battle'],
	cooldown: 5000,

	execute: async function (p) {
		// p is the param initialized by command engine
		try {
			const author = p.msg.author;
			const args = p.args || [];
			const sub = args[0] ? args[0].toLowerCase() : null;

			if (!sub || sub === 'help') {
				p.replyMsg('⚔️', ', Usage: `battle challenge @user` | `battle accept <id>` | `battle decline <id>` | `battle team set <id1> <id2> <id3>`');
				return;
			}

			// CHALLENGE
			if (sub === 'challenge') {
				const mention = args[1] || args[0] && p.msg.mentions && p.msg.mentions[0];
				let target;
				if (p.msg.mentions && p.msg.mentions[0]) target = p.msg.mentions[0];
				else if (mention) target = await p.fetch.getUser(mention);

				if (!target) {
					p.replyMsg('⚔️', ', You must mention a valid user to challenge!');
					return;
				}

				if (target.id === author.id) {
					p.replyMsg('⚔️', ', You cannot challenge yourself!');
					return;
				}

				// Create battle
				const battleId = uuidv4();
				const authorProfile = db.getUserProfile(author.id);
				const targetProfile = db.getUserProfile(target.id);

				const battle = db.createBattle(battleId, {
					players: [
						{ userId: author.id, username: author.username, team: authorProfile.team || [], ready: true },
						{ userId: target.id, username: target.username, team: targetProfile.team || [], ready: false }
					],
					turn: 0,
					status: 'pending'
				});

				p.replyMsg('⚔️', `, Battle request sent to **${target.username}** (id: ${battleId}). They can accept with: \\`battle accept ${battleId}\\``);
				return;
			}

			// ACCEPT
			if (sub === 'accept') {
				const id = args[1];
				if (!id) { p.replyMsg('⚔️', ', You must provide a battle id to accept'); return; }
				const battle = db.getBattle(id);
				if (!battle) { p.replyMsg('⚔️', ', Battle not found'); return; }
				const player = battle.players.find(pl => pl.userId === p.msg.author.id);
				if (!player && battle.players.find(pl => pl.userId !== p.msg.author.id)) {
					// allow the challenged user to accept
					// set challenged player ready
					const idx = battle.players.findIndex(pl => pl.userId === p.msg.author.id);
					if (idx === -1) {
						// find opposing slot for this author
						const oppIdx = battle.players.findIndex(pl => pl.userId !== p.msg.author.id);
						// not in battle
						p.replyMsg('⚔️', ', You are not part of this battle');
						return;
					}
				}

				// Mark the author as ready
				for (let i=0;i<battle.players.length;i++) {
					if (battle.players[i].userId === p.msg.author.id) battle.players[i].ready = true;
				}
				// If all ready -> start
				const allReady = battle.players.every(pl => pl.ready);
				if (allReady) {
					battle.status = 'active';
					battle.turn = 0;
					// initialize hp state
					for (const pl of battle.players) {
						pl.hpState = pl.team.map(() => 100);
					}
					db.updateBattle(id, battle);
					p.replyMsg('⚔️', `, Battle **${id}** started! Good luck.`);
					return;
				} else {
					db.updateBattle(id, battle);
					p.replyMsg('⚔️', `, You accepted battle **${id}**. Waiting for the other player...`);
					return;
				}
			}

			// DECLINE
			if (sub === 'decline') {
				const id = args[1];
				if (!id) { p.replyMsg('⚔️', ', You must provide a battle id to decline'); return; }
				const battle = db.getBattle(id);
				if (!battle) { p.replyMsg('⚔️', ', Battle not found'); return; }
				if (!battle.players.find(pl => pl.userId === p.msg.author.id)) { p.replyMsg('⚔️', ', You are not part of this battle'); return; }
				db.deleteBattle(id);
				p.replyMsg('⚔️', `, You have declined battle **${id}**`);
				return;
			}

			// TEAM management
			if (sub === 'team') {
				const action = args[1];
				if (action === 'set') {
					const picks = args.slice(2).slice(0,3);
					db.setTeam(p.msg.author.id, picks);
					p.replyMsg('⚔️', `, Your team has been updated: ${picks.join(', ')} | Footer: Fowo BOT`);
					return;
				} else {
					const profile = db.getUserProfile(p.msg.author.id);
					p.replyMsg('⚔️', `, Your team: ${ (profile.team || []).join(', ') || 'none' } | Footer: Fowo BOT`);
					return;
				}
			}

			p.replyMsg('⚔️', ', Unknown subcommand. Use `battle help`');
		} catch (err) {
			console.error(err);
			p.replyMsg('⚔️', ', Error processing battle command');
		}
	}
});
