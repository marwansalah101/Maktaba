// Strip all HTML tags from a string to prevent stored XSS
function stripHtml(str) {
    return String(str || '').replace(/<[^>]*>/g, '').trim();
}

module.exports = { stripHtml };
