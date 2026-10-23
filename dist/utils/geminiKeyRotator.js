// Round-robins across one or more Gemini API keys supplied in
// DISCORD_GEMINI_API_KEY, so a single key's free-tier rate limit doesn't
// get hammered by every request.
//
// Accepts a comma-separated list, e.g.:
//   DISCORD_GEMINI_API_KEY=key1,key2,key3
// Also tolerates keys individually wrapped in quotes and extra whitespace,
// e.g. DISCORD_GEMINI_API_KEY="key1","key2","key3" - each token has its
// surrounding quotes stripped.
let keys = null;
let nextIndex = 0;
function loadKeys() {
    const raw = process.env.DISCORD_GEMINI_API_KEY;
    if (!raw) {
        throw new Error("DISCORD_GEMINI_API_KEY is not set");
    }
    const parsed = raw
        .split(",")
        .map((key) => key
        .trim()
        // strip one pair of surrounding quotes, single or double
        .replace(/^['"]|['"]$/g, "")
        .trim())
        .filter((key) => key.length > 0);
    if (parsed.length === 0) {
        throw new Error("DISCORD_GEMINI_API_KEY is set but contains no usable keys");
    }
    return parsed;
}
/**
 * Returns the next Gemini API key in rotation. Keys are parsed from
 * DISCORD_GEMINI_API_KEY once and cached; call this fresh each time you
 * need a key so successive calls (and thus successive Gemini requests)
 * cycle through all configured keys in order.
 */
export function getNextGeminiApiKey() {
    if (!keys) {
        keys = loadKeys();
    }
    const key = keys[nextIndex];
    nextIndex = (nextIndex + 1) % keys.length;
    return key;
}
