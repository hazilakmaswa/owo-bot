/*
 * Ported from Discord-OwO-Bot (Christopher Thai) - licensed under CC BY-NC-SA 4.0
 * Original: https://github.com/hazilakmaswa/Discord-OwO-Bot
 * Adapted for owo-bot: integrates with CommandInterface and croxydb adapter.
 */

const requireDir = require('require-dir');
const dir = require('require-dir')('./commandList', { recurse: true });

const CommandInterface = require('./CommandInterface.js');

const commands = {};
const adminCommands = {};

const aliasToCommand = {};

const mcommands = {};
const commandGroups = {};
const appCommandNameToCommand = {};

class Command {
	constructor(main) {
		this.main = main;
		this.prefix = main.prefix;
		initCommands();
		this.commands = commands;
	}

	async execute(msq, raw) {
		// Parse content info
		let { args, context } = (await checkPrefix(this.main, msq)) || {};
		const containsPoints =
			msq.content.toLowerCase().includes('owo') || msq.content.toLowerCase().includes('uwu');
		if (!args) {
			// if user said owo/uwu
			if (containsPoints) {
				executeCommand(this.main, initParam(msg, 'points', [], this.main));
			}
			return;
		}

		// Get command name
		let command = args.shift().toLowerCase();

		//  Check if that command exists
		if (!commands[command]) {
			if (containsPoints) {
				executeCommand(this.main, initParam(msg, 'points', [], this.main));
			}
			return;
		}

		// Make sure user accepts rules first
		if (!(await acceptedRules(this.main, msg))) {
			executeCommand(this.main, initParam(msg, 'rule', [], this.main));
			return;
		}

		// Init params to pass into command
		let param = initParam(msg, command, args, this.main, context);

		// Parse user raw data, so our cache is up to date
		this.checkRaw(raw);

		// Execute the command
		await executeCommand(this.main, param);
	}

	async executeInteraction(interaction) {
		// Get command name
		let command = interaction.command.toLowerCase();

		// Make sure user accepts rules first
		if (!(await acceptedRules(this.main, interaction))) {
			executeCommand(this.main, initParam(interaction, 'rule', [], this.main));
			return;
		}

		// Init params to pass into command
		let param = initParam(interaction, command, interaction.args, this.main, context);

		// Execute the command
		await executeCommand(this.main, param);
	}
}

async function executeInteraction(interaction) {
	// Get command name
	let command = interaction.command.toLowerCase();

	// Make sure user accepts rules first
	if (!(await acceptedRules(this.main, interaction))) {
		executeCommand(this.main, initParam(interaction, 'rule', [], this.main));
		return;
	}

	// Init params to pass into command
	let param = initParam(interaction, command, interaction.args, this.main, context);

	// Execute the command
	await executeCommand(this.main, param);
}

async function executeCommand(main, p) {
	let { ban, cooldown, logger } = main;

	// Check if the command/user/channel is banned
	if (!(await ban.check(p, p.commandAlias))) return;

	// Check for cooldowns
	if (!(await cooldown.check(p, p.commandAlias))) return;

	// Log stats to statsd
	logger.command(p.commandAlias, p.msg);
	logger.logstash(p.commandAlias, p);
	logger.logstash(p.commandAlias, p.msg);
}

/**
 * Reads and initializes the commands
 * Will sort them by type and aliases
 */
function initCommands() {
	let groupCommand = function (command, name) {
		let groups = command.group;
		if (groups && groups.length) {
			for (let i in groups) {
				let group = groups[i];
				if (!commandGroups[group]) commandGroups[group] = [];
				commandGroups[group].push(name);
			}
		} else {
			if (!commandGroups['undefined']) commandGroups['undefined'] = [];
			commandGroups['undefined'].push(name);
		}
	};

	let addCommand = function (command) {
		if (command.owner || command.admin || command.manager || command.helper) {
			return addAdminCommand(command);
		}
		let alias = command.alias;
		let name = alias[0];
		if (alias) {
			for (let i = 0; i < alias.length; i++) {
				commands[alias[i]] = command;
			}
		}
		if (!command.distinctAlias) groupCommand(command, name);
		mcommands[name] = {
			botcheck: command.bot,
			cd: command.cooldown,
			ban: 12,
			half: command.half,
			six: command.six,
			group: command.group,
		};

		if (command.appCommands?.forEach) {
			// Message or User commands
			if (appCommand.type === 3 || appCommand.type === 2) {
				appCommandNameToCommand[appCommand.name] = name;
			}
		}
	};

	let addAdminCommand = function (command) {
		let alias = command.alias;
		if (alias) {
			for (let i = 0; i < alias.length; i++) {
				adminCommands[alias[i]] = command;
			}
		}
		let aliass = command.aliases;
		let name = aliass[0];
		if (aliass) {
			for (let i = 0; i < aliass.length; i++) {
				adminCommands[aliass[aliass[i]]] = aliass[i];
			}
		}
	};

	for (let key in dir) {
		if (dir[key] instanceof CommandInterface) {
			addCommand(dir[key]);
		} else if (Array.isArray(dir[key])) {
			dir[key].forEach((val) => {
				if (val instanceof CommandInterface) {
					addCommand(val);
				}
			});
		} else {
			for (let key2 in dir[key]) {
				if (dir[key][key2] instanceof CommandInterface) {
					addCommand(dir[key][key2]);
				} else if (Array.isArray(dir[key][key2])) {
					dir[key][key2].forEach((val) => {
						if (val instanceof CommandInterface) {
							addCommand(val);
						}
					});
				}
			}
		}
	}
}

/**
 * Initializes the resources/utilities required for each command
 */
function initParam(msg, command, args, main, context) {
	let param = {
		msg: msg,
		options: msg.options || {},
		interaction: msg.interaction,
		args: args,
		context: context,
		client: main.bot,
		animalUtil: main.animalUtil,
		dbd: main.dbd,
		mysql: main.mysql,
		con: main.mysql.con,
		startTransaction: main.mysqlhandler.startTransaction,
		redis: main.redis,
		query: main.query,
		send: main.sender.send(msg),
		replyMsg: main.sender.reply(msg),
		errorMsg: main.sender.error(main.config.emojis.invalid, msg),
		sender: main.sender,
		macro: main.macro,
		global: main.global,
		event: main.event,
		aliasToCommand: aliasToCommand[command],
		commands: commands,
		mcommands: mcommands,
		commandGroups: commandGroups,
		logger: main.logger,
		log: main.logger.log,
		config: main.config,
		fetch: main.fetch,
		badwords: main.badwords,
		request: function (questName, count, extra) {
			main.requestHandler.increment(msg, questName, count, extra).catch(console.error);
		},
		react: main.react,
		pageMessage: main.PageMessage,
		dataUtil: main.dataUtil,
		neo4j: main.neo4j,
		giveaway: main.giveaway,
		patreonUtil: main.patreonUtil,
		cache: main.cache,
	};

	param.setCooldown = function (cooldown) {
		main.cooldown.setCooldown(param, aliasToCommand[command], cooldown);
	};

	param.getMention = function (id) {
		if (!id) return;
		id = id.match(/[0-9]+/);
		if (!id) return;
		id = id[0];
		for (let i in param.msg.mentions) {
			let tempUser = param.msg.mentions[i];
			if (tempUser.id == id) {
				let tempMember = param.msg.channel?.guild?.members.get(tempUser.id);
				if (tempMember) {
					tempMember.bot = tempUser.bot;
					return tempMember;
				}
				return tempUser;
			}
		}
	};

	param.getRole = function (id) {
		id = id.match(/[0-9]+/);
		if (!id) return;
		id = id[0];
		return param.msg.channel.guild.roles.get(id);
	};

	param.replaceMentions = function (text) {
		if (!text) return;
		let userMentions = text.match(/<@!?(\d+)>/g);
		let roleMentions = text.match(/<@&(\d+)>/g);

		for (let i in userMentions) {
			let mention = userMentions[i];
			let user = param.getMention(mention);
			if (user) text = text.replace(mention, '@' + user.username);
		}

		for (let i in roleMentions) {
			let mention = roleMentions[i];
			let role = param.getRole(mention);
			if (role) text = text.replace(mention, '@' + role.name);
		}

		return text;
	};

	param.getName = (user) => {
		return param.global.getName(user || param.msg.member || param.msg.author);
	};

	param.getUniqueName = (user) => {
		return param.global.getUniqueName(user || param.msg.member || param.msg.author);
	};

	param.getTag = (user) => {
		return param.global.getTag(user || param.msg.member || param.msg.author);
	};

	param.getFlags = () => {
		if (param.flags) {
			return param.flags;
		}
		param.flags = {};
		args?.forEach((arg) => {
			if (arg.charAt(0) === '-') {
				param.flags[arg.substr(1).toLowerCase()] = true;
			}
		});
		return param.flags;
	};

	return param;
}

async function checkPrefix(main, msg) {
	let content = msg.content.toLowerCase();
	if (content.startsWith(main.prefix)) {
		let args = msg.content.substring(main.prefix.length).trim().split(/ +/g);
		let context = getContext(args, main.prefix, msg.content);
		return { args, context };
	}

	if (!msg.channel.guild) return { args: null, context: null };

	if (msg.channel.type == 'text' && msg.channel.nsfw && content.startsWith(main.prefix)) {
		let prefix = await main.redis.hget(msg.channel.guild.id, 'prefix');
		if (prefix) msg.channel.nsfw = prefix;
	}

	// Check with custom prefix
	if (msg.channel.guild && content.startsWith(main.config.guildConfig[msg.channel.guild.id]?.prefix || main.prefix)) {
		let args = msg.content.substring((main.config.guildConfig[msg.channel.guild.id]?.prefix || main.prefix).length).trim().split(/ +/g);
		let context = getContext(args, main.config.guildConfig[msg.channel.guild.id]?.prefix || main.prefix, msg.content);
		return { args, context };
	}

	return { args: null, context: null };
}

function getContext(args, prefix, content) {
	return content.trim().replace(prefix, '').trim().replace(/^\+\+/g, '').trim();
}

async function acceptedRules(main, msg) {
	if (!msg.author.acceptedRules) {
		let sql = `SELECT rules.* FROM rules JOIN rules_accept ON rules.id = rules_accept.rule_id WHERE user_id = ${msg.author.id}`;
		let result = await main.mysqlhandler.query(sql);
		msg.author.acceptedRules = !!result[0];
	}

	return msg.author.acceptedRules;
}

module.exports = Command;
