const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { AttachmentBuilder } = require('discord.js');

/**
 * Generate a visual RPG Profile Card as a PNG image buffer
 * @param {object} user Discord User object
 * @param {object} profile User data from croxydb
 * @param {number} totalAnimals Total animals count
 * @returns {Promise<AttachmentBuilder>} Discord AttachmentBuilder object
 */
async function generateProfileCard(user, profile, totalAnimals) {
  const width = 800;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background Gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0f0c29');
  gradient.addColorStop(0.5, '#302b63');
  gradient.addColorStop(1, '#24243e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Inner Card Glass Panel
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  roundRect(ctx, 30, 30, width - 60, height - 60, 20, true, true);

  // Draw Avatar
  const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 256 });
  try {
    const avatar = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(120, 140, 60, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 60, 80, 120, 120);
    ctx.restore();

    // Avatar Border Ring
    ctx.strokeStyle = '#9b59b6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(120, 140, 62, 0, Math.PI * 2, true);
    ctx.stroke();
  } catch (err) {
    console.error('Failed to load avatar in canvas:', err);
  }

  // Draw User Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(user.username, 210, 110);

  // Level Badge
  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`Level ${profile.level || 1}`, 210, 140);

  // XP Progress Bar Background
  const xpCurrent = profile.xp || 0;
  const xpNeeded = (profile.level || 1) * 1000;
  const xpRatio = Math.min(1, xpCurrent / xpNeeded);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  roundRect(ctx, 210, 155, 520, 18, 9, true, false);

  ctx.fillStyle = '#2ecc71';
  roundRect(ctx, 210, 155, Math.max(18, 520 * xpRatio), 18, 9, true, false);

  ctx.fillStyle = '#ffffff';
  ctx.font = '14px sans-serif';
  ctx.fillText(`${xpCurrent} / ${xpNeeded} XP`, 430, 170);

  // Stats Grid
  const statsY = 230;
  drawStatBox(ctx, 60, statsY, 150, 70, '🪙 Cowoncy', `${(profile.cash || 0).toLocaleString()}`, '#f1c40f');
  drawStatBox(ctx, 230, statsY, 150, 70, '🐾 Zoo Count', `${totalAnimals} Animals`, '#3498db');
  drawStatBox(ctx, 400, statsY, 150, 70, '🔥 Daily Streak', `${profile.dailyStreak || 0} Days`, '#e74c3c');
  drawStatBox(ctx, 570, statsY, 160, 70, '💍 Married', profile.marriedTo ? 'Married 💖' : 'Single', '#e91e63');

  // Bio Text Box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'italic 16px sans-serif';
  ctx.fillText(`"${profile.bio || 'I love OwO Bot!'}"`, 60, 340);

  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: 'profile-card.png' });
}

function drawStatBox(ctx, x, y, w, h, title, value, color) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  roundRect(ctx, x, y, w, h, 10, true, false);

  ctx.fillStyle = color;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(title, x + 12, y + 25);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(value, x + 12, y + 52);
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

module.exports = {
  generateProfileCard
};
