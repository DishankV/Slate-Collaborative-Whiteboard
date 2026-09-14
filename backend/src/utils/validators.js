const BOARD_ID_RE = /^[a-z0-9-]{6,40}$/i;

function isValidBoardId(id) {
  return typeof id === 'string' && BOARD_ID_RE.test(id);
}

// Strips control characters and clamps length; React escapes on render so this
// is defense-in-depth rather than the only XSS protection.
function cleanText(input, maxLen) {
  if (typeof input !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  const stripped = input.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  return stripped.slice(0, maxLen);
}

function isValidHexColor(color) {
  return typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color);
}

module.exports = { isValidBoardId, cleanText, isValidHexColor };
