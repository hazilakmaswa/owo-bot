/*
 * Ported from Discord-OwO-Bot (Christopher Thai) - licensed under CC BY-NC-SA 4.0
 * Source: https://github.com/hazilakmaswa/Discord-OwO-Bot/src/commands/commandList/battle/team.js
 * Adapted to use croxydb adapter (src/database/db.js) and CommandInterface
 */

const CommandInterface = require('../../CommandInterface.js');
const teams = require('../../../../systems/teams'); // if you port teams util
const teamUtil = require('../../../utils/teamUtil');
const battleFriendUtil = require('../../../utils/battleFriendUtil');

module.exports = new CommandInterface({
	alias: ['team', 'squad', 'tm'],
	args: '{add|remove|rename}',
	desc: 'Display your team!',
	example: ['owo team', 'owo team add dog 1', 'owo team rename My Team'],
	related: ['owo battle'],
	permissions: ['sendMessages', 'embedLinks', 'addReactions'],
	group: ['animals'],
	cooldown: 3000,
	half: 80,
	six: 500,

	execute: async function (p) {
		try {
			let subcommand = p.args[0];
			if (subcommand !== undefined) subcommand = subcommand.toLowerCase();
			if (!subcommand) subcommand = 'display';

			if (p.args.length === 0 || subcommand === 'display') {
				await teamUtil.displayTeam(p);
				return;
			}

			if (['set','s','add','a','replace'].includes(subcommand)) {
				if (await battleFriendUtil.inBattle(p)) return; // guard
				await teamUtil.add(p);
				return;
			}

			if (['remove','delete','d'].includes(subcommand)) {
				if (await battleFriendUtil.inBattle(p)) return;
				await teamUtil.remove(p);
				return;
			}

			if (['rename','r'].includes(subcommand)) {
				await teamUtil.rename(p);
				return;
			}

			if (subcommand === 'help') {
				p.help = true;
				p.hcommand = 'team';
				return;
			}
		} catch (err) {
			console.error(err);
			p.errorMsg(', Something went wrong... Try again!', 5000);
		}
	}
});
