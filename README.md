# 🌿 OwO Bot Enhanced (Discord.js v14 + croxydb + Canvas)

[![Developer](https://img.shields.io/badge/Developer-Senotron-purple.svg)](https://github.com/senotron)
[![Repository](https://img.shields.io/badge/GitHub-senotron%2Fowo--bot-black.svg)](https://github.com/senotron/owo-bot)
[![Node.js Version](https://img.shields.io/badge/Node.js-v18.0%2B-green.svg)](https://nodejs.org)
[![Discord.js](https://img.shields.io/badge/discord.js-v14.14-blue.svg)](https://discord.js.org)
[![Database](https://img.shields.io/badge/Database-croxydb-orange.svg)](https://www.npmjs.com/package/croxydb)
[![Canvas Engine](https://img.shields.io/badge/Canvas-%40napi--rs%2Fcanvas-red.svg)](https://www.npmjs.com/package/@napi-rs/canvas)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An advanced, feature-packed **OwO Discord Bot Clone** built with **Node.js**, **Discord.js v14**, **croxydb**, and **@napi-rs/canvas**. Designed for open-source deployment, ultra-fast performance, and 100% bug-free execution.

Supports both **Prefix Commands** (`owo hunt`, `w h`, `owo zoo`, `w z`, `owo slots`, `w bj`, `owo lotto`) and native **Slash Commands** (`/hunt`, `/zoo`, `/slots`, `/battle`, `/blackjack`, `/owoify`, `/lottery`).

---

## ✨ Features

- 🎨 **Canvas RPG Profile Cards:** Live PNG card generation using `@napi-rs/canvas` featuring avatar crop, XP progress bar, stats grid, and custom bio.
- 🌿 **Hunting & Zoo System:** Catch wild animals across 9 rarity tiers (Common 🐱 to Gem 💎 and Special 👑). Supports `owo sell all` and `owo sell common`.
- ⚔️ **Pet RPG Battle Simulator:** Setup 3-animal squads with elemental stats (HP, ATK, DEF, Speed) and fight wild bosses.
- 🎰 **Casino & Gambling Games:**
  - **Slots:** 3-reel animated slot machine with interactive `[Spin Again]` buttons.
  - **Blackjack:** Full card dealer game featuring `[Hit]`, `[Stand]`, `[Double Down]` Discord Message Components V2.
  - **Coinflip:** Double-or-nothing betting.
  - **Lottery:** Global Cowoncy jackpot pool with ticket buying (`owo lotto buy`).
- 🎒 **Inventory, Shop & Lootboxes:** Buy lootboxes, luck gems, and diamond rings from `owo shop`.
- 💍 **Marriage & Social:** Propose marriage with `owo marry`, pray/curse players, set bio (`owo bio`), and translate OwO speak (`owo owoify`).
- 💾 **Zero-Config Database:** Powered by `croxydb` for instant, reliable local JSON database storage without needing external SQL/Mongo setups.
- 🔘 **Discord Message Components V2:** Interactive buttons, String Select Menus, and Action Rows with author-locking security.

---

## 📜 Command List

| Command | Aliases | Description |
| :--- | :--- | :--- |
| `owo hunt` | `w h`, `catch` | Hunt wild animals and earn Cowoncy & XP with `[Hunt Again]` button |
| `owo zoo` | `w z`, `animals` | View zoo collection with SelectMenu rarity filters |
| `owo sell <animal/all/common>` | - | Bulk sell animals or specific species for Cowoncy |
| `owo sac <animal>` | `sacrifice` | Sacrifice animals to divine Essence |
| `owo battle` | `w b`, `ab` | Fight turn-based battles with your pet team |
| `owo team <a1> <a2> <a3>` | - | Configure your 3-animal battle squad |
| `owo slots <bet>` | `w s` | Play slot machine with interactive re-spin |
| `owo blackjack <bet>` | `w bj` | Play Blackjack card game (`[Hit]`, `[Stand]`, `[Double]`) |
| `owo coinflip <bet> <h/t>` | `w cf` | Flip coins for double Cowoncy |
| `owo lottery` | `lotto`, `ticket` | Join global jackpot pool or buy tickets (`owo lotto buy`) |
| `owo cash` | `bal`, `money` | Check your Cowoncy balance |
| `owo daily` | - | Claim 24h reward and build streak multipliers |
| `owo pray <user>` | - | Pray for a user to boost their hunting luck |
| `owo curse <user>` | - | Cast a curse upon another user |
| `owo inventory` | `inv`, `shop` | Manage items, buy lootboxes, or use gems |
| `owo profile` | `p` | View your live **Canvas PNG RPG profile card** |
| `owo bio <text>` | - | Customize your profile bio text |
| `owo owoify <text>` | `uwu` | Translate text into cute OwO / UwU speak |
| `owo marry @user` | - | Propose marriage with a Diamond Ring |
| `owo leaderboard` | `lb`, `top` | View global wealth rankings |
| `owo 8ball` / `roll` / `pick` | `choose` | Fun mini-tools (8-ball, dice roll, random choice picker) |
| `owo help` | `w`, `commands` | Interactive help center menu with StringSelectMenu |

---

## 🚀 Quick Setup & Installation

### Prerequisites
- [Node.js v18.0.0](https://nodejs.org) or higher.
- A Discord Bot Token from the [Discord Developer Portal](https://discord.com/developers/applications).

### Step 1: Clone Repository
```bash
git clone https://github.com/senotron/owo-bot.git
cd owo-bot
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
Copy `.env.example` to `.env` and fill in your Discord Bot Token:
```env
DISCORD_TOKEN=your_actual_bot_token_here
CLIENT_ID=your_client_application_id
PREFIX=owo 
```

> **Note:** Make sure to enable **Message Content Intent** in your Discord Developer Portal under Bot Settings.

### Step 4: Start the Bot
```bash
npm start
```

---

## 🛡️ License

Distributed under the MIT License. Developed by **Senotron**. See `LICENSE` for more information.
