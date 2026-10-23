// Heuristic check for "is this a single real unicode emoji" (allowing for
// ZWJ sequences, skin tone modifiers, and variation selectors). Discord's
// API rejects the *entire* message/component payload with
// COMPONENT_INVALID_EMOJI if any option's emoji.name isn't an emoji it
// recognizes, so we deliberately err on the side of rejecting anything
// that looks like plain text.
export function isValidUnicodeEmoji(value) {
    if (
    // Plain letters/digits mean it's almost certainly text
    // (e.g. "Wb", "trophy"), not an emoji.
    /[a-zA-Z0-9]/.test(value)) {
        return false;
    }
    if (![
        ...value,
    ].some((char) => /\p{Extended_Pictographic}/u.test(char))) {
        return false;
    }
    // Real single emoji (even complex ZWJ sequences) are short.
    // Anything longer is likely multiple emoji or stray text.
    return ([
        ...value,
    ].length <= 8);
}
const CUSTOM_EMOJI_PATTERN = /^<(a?):(\w+):(\d+)>$/;
// Use this to validate user-typed input before saving it (accepts both
// custom server emoji syntax and real unicode emoji).
export function isValidEmojiInput(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        return true;
    }
    return (CUSTOM_EMOJI_PATTERN.test(trimmed) ||
        isValidUnicodeEmoji(trimmed));
}
export function parseEmoji(emoji) {
    if (!emoji?.trim()) {
        return undefined;
    }
    const trimmed = emoji.trim();
    // Custom server emoji, e.g. <:name:123456789012345678>
    // or animated <a:name:123456789012345678>
    const match = trimmed.match(/^<(a?):(\w+):(\d+)>$/);
    if (match) {
        return {
            id: match[3],
            name: match[2],
            animated: match[1] === "a",
        };
    }
    // If it's not a valid unicode emoji either, drop it instead of
    // sending an invalid emoji object to Discord and breaking the
    // whole component tree.
    if (!isValidUnicodeEmoji(trimmed)) {
        return undefined;
    }
    // Unicode emoji must also be passed as an object ({ name }),
    // not a raw string, or Discord will silently fail to render it.
    return {
        name: trimmed,
    };
}
