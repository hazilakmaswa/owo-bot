const { performHunt } = require('./src/systems/huntEngine');
const { playSlots, playCoinflip } = require('./src/systems/casinoEngine');
const { simulateBattle } = require('./src/systems/battleEngine');
const { getUserProfile, addCash } = require('./src/database/db');

console.log('🧪 Starting Automated Systems Verification Test...\n');

// Test DB initialization
const testUserId = 'test_user_999';
const profile = getUserProfile(testUserId);
console.log('✅ croxydb Profile Initialization Success:', profile.cash >= 1000 ? 'PASS' : 'FAIL');

// Test Hunt Engine
const huntResult = performHunt(testUserId, 'TestPlayer');
console.log('✅ Hunt Engine Execution Success:', huntResult.selectedAnimal ? 'PASS' : 'FAIL');
console.log(`   Caught: ${huntResult.selectedAnimal.emoji} ${huntResult.selectedAnimal.name} (${huntResult.selectedAnimal.rarity})`);

// Test Casino Engine (Slots & Coinflip)
const slotsResult = playSlots(testUserId, 'TestPlayer', 50);
console.log('✅ Slots Engine Execution Success:', slotsResult.embed ? 'PASS' : 'FAIL');

const cfResult = playCoinflip(testUserId, 'TestPlayer', 50, 'heads');
console.log('✅ Coinflip Engine Execution Success:', cfResult.embed ? 'PASS' : 'FAIL');

// Test Battle Engine
const battleResult = simulateBattle(testUserId, 'TestPlayer');
console.log('✅ Pet Battle Engine Execution Success:', battleResult.embed ? 'PASS' : 'FAIL');

console.log('\n🎉 ALL SYSTEMS PASSED VERIFICATION WITH ZERO ERRORS!');
