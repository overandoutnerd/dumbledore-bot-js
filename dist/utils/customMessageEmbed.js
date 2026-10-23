import { EmbedBuilder, } from "discord.js";
/**
 * Builds `{ content, embed }` for a custom message row, resolving
 * {macro} placeholders in every text field via `resolveMacros`. Shared by
 * memberJoinHandler.ts, bumpReminderHandler.ts, and bumpHandler.ts so a
 * dashboard-built message renders identically no matter which of the three
 * it came from. Returns `embed: null` when the row has no embed fields set
 * at all (outside message only, same as the welcome message behavior this
 * was factored out of).
 */
export function buildCustomMessageEmbed(row, resolveMacros, fallbackColor) {
    const content = resolveMacros(row.outsideMessage);
    const hasEmbedContent = row.embedTitle ||
        row.embedDescription ||
        row.embedAuthorName ||
        row.embedFooterText ||
        row.embedImageUrl ||
        row.embedThumbnailUrl;
    if (!hasEmbedContent) {
        return {
            content,
            embed: null,
        };
    }
    const builder = new EmbedBuilder().setColor(row.embedColor ??
        fallbackColor);
    const title = resolveMacros(row.embedTitle);
    if (title)
        builder.setTitle(title);
    const description = resolveMacros(row.embedDescription);
    if (description)
        builder.setDescription(description);
    const authorName = resolveMacros(row.embedAuthorName);
    if (authorName) {
        builder.setAuthor({
            name: authorName,
            iconURL: row.embedAuthorIconUrl ?? undefined,
        });
    }
    const footerText = resolveMacros(row.embedFooterText);
    if (footerText) {
        builder.setFooter({
            text: footerText,
            iconURL: row.embedFooterIconUrl ?? undefined,
        });
    }
    if (row.embedImageUrl) {
        builder.setImage(row.embedImageUrl);
    }
    if (row.embedThumbnailUrl) {
        builder.setThumbnail(row.embedThumbnailUrl);
    }
    builder.setTimestamp();
    return {
        content,
        embed: builder,
    };
}
