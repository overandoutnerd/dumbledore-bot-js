import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, } from "discord.js";
export const NO_EMOJI_VALUE = "__no_emoji__";
// Select menus can only hold 25 options total, so we reserve one slot
// for "No emoji" and cap the rest to the guild's first 24 custom emojis.
const MAX_EMOJI_OPTIONS = 24;
function formatEmojiValue(emoji) {
    const name = emoji.name ??
        "emoji";
    return emoji.animated
        ? `<a:${name}:${emoji.id}>`
        : `<:${name}:${emoji.id}>`;
}
// Builds a select menu populated with this server's custom emojis, so
// admins pick from what actually exists instead of typing free text
// that Discord might reject.
export async function buildEmojiSelectMenu(guild, customId, currentValue) {
    const emojis = await guild.emojis.fetch();
    const noneOption = new StringSelectMenuOptionBuilder()
        .setLabel("No emoji")
        .setValue(NO_EMOJI_VALUE)
        .setDefault(!currentValue);
    const emojiOptions = [
        ...emojis.values(),
    ]
        .slice(0, MAX_EMOJI_OPTIONS)
        .map((emoji) => {
        const value = formatEmojiValue({
            id: emoji.id,
            name: emoji.name,
            animated: emoji.animated ??
                false,
        });
        return new StringSelectMenuOptionBuilder()
            .setLabel(emoji.name ??
            "emoji")
            .setValue(value)
            .setEmoji({
            id: emoji.id,
            name: emoji.name ??
                undefined,
            animated: emoji.animated ??
                false,
        })
            .setDefault(currentValue ===
            value);
    });
    return new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder("Select an emoji (optional)...")
        .setRequired(false)
        .addOptions(noneOption, ...emojiOptions);
}
// Converts the selected value from a modal submission back into the
// string we store in the database (null for "no emoji").
export function resolveEmojiSelection(values) {
    const selected = values[0];
    if (!selected ||
        selected ===
            NO_EMOJI_VALUE) {
        return null;
    }
    return selected;
}
