/**
 * Helper utility untuk parse customId dari buttons
 * Format: action_subaction_userId_extraData
 * Contoh: hunt_again_123456789, buy_lotto_10_123456789
 */

function parseButtonId(customId) {
  if (!customId || typeof customId !== 'string') {
    return { error: 'Invalid customId', parts: [] };
  }

  const parts = customId.split('_');
  const action = parts[0] || null;
  const subAction = parts[1] || null;
  const ownerId = parts[2] || parts[1] || null;
  
  return {
    fullId: customId,
    parts,
    action,
    subAction,
    ownerId,
    extraData: parts.slice(3) // untuk data tambahan seperti bet amount
  };
}

/**
 * Validate apakah user yang click button adalah owner-nya
 */
function validateButtonOwnership(customId, userId, allowedPublicButtons = []) {
  const parsed = parseButtonId(customId);
  
  if (!parsed.ownerId) {
    return true; // Jika tidak ada ownerId, allow semua
  }

  // Check apakah ini public button (misal help, shop)
  const isPublic = allowedPublicButtons.some(prefix => customId.startsWith(prefix));
  if (isPublic) return true;

  return parsed.ownerId === userId;
}

/**
 * Extract numeric value dari customId (misal bet amount)
 */
function extractNumericValue(customId, partIndex = 3) {
  const parts = customId.split('_');
  const value = parseInt(parts[partIndex]);
  return isNaN(value) ? null : value;
}

module.exports = {
  parseButtonId,
  validateButtonOwnership,
  extractNumericValue
};
