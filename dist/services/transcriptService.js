// Cycled per distinct mod (by order of first message), purely so different
// mods are visually distinguishable in the transcript - not tied to any
// role color.
const MOD_ACCENT_COLORS = [
    "#3d6b8c",
    "#7a4f9e",
    "#2f8f6f",
    "#a05a2c",
    "#8c3d5c",
    "#4f6b3d",
];
const TARGET_COLOR = "#e46c32";
const REPLY_SNIPPET_MAX_LENGTH = 80;
function truncateSnippet(content) {
    const flattened = content
        .replace(/\s+/g, " ")
        .trim();
    if (flattened.length <= REPLY_SNIPPET_MAX_LENGTH) {
        return flattened;
    }
    return `${flattened.slice(0, REPLY_SNIPPET_MAX_LENGTH).trimEnd()}…`;
}
function formatDurationSeconds(openedAt, closedAt) {
    return Math.max(0, Math.round((closedAt.getTime() -
        openedAt.getTime()) /
        1000));
}
/**
 * Builds a self-contained, JSON-serializable transcript of an interview
 * channel for the dashboard to render. Every non-target speaker is labeled
 * "Mod 1", "Mod 2", etc. in order of first appearance (their real display
 * name/tag is still included so the transcript stays identifiable),
 * matching the conversational "User: / Mod 1: / Mod 2:" shape the
 * transcript is meant to read like.
 */
export function buildInterviewTranscript(options) {
    const speakers = new Map();
    const modIds = [];
    for (const message of options.messages) {
        if (message.isTarget) {
            continue;
        }
        if (speakers.has(message.authorId)) {
            continue;
        }
        const index = modIds.length;
        speakers.set(message.authorId, {
            label: `Mod ${index + 1}`,
            color: MOD_ACCENT_COLORS[index %
                MOD_ACCENT_COLORS.length],
        });
        modIds.push(message.authorId);
    }
    const modTagsById = new Map(options.messages
        .filter((message) => !message.isTarget)
        .map((message) => [
        message.authorId,
        message.authorTag,
    ]));
    const messages = options.messages.map((message) => {
        const speaker = message.isTarget
            ? {
                label: "User",
                color: TARGET_COLOR,
            }
            : speakers.get(message.authorId);
        return {
            id: message.id,
            authorId: message.authorId,
            authorTag: message.authorTag,
            displayName: message.displayName,
            avatarUrl: message.avatarUrl,
            isTarget: message.isTarget,
            speaker,
            content: message.content,
            createdAt: message.createdAt.toISOString(),
            attachmentUrls: message.attachmentUrls,
            replyTo: message.replyTo,
        };
    });
    const modsInvolved = modIds.map((id) => ({
        id,
        tag: modTagsById.get(id) ?? id,
        label: speakers.get(id).label,
        color: speakers.get(id).color,
    }));
    const data = {
        interviewNumber: options.interviewNumber,
        guildName: options.guildName,
        channelName: options.channelName,
        creator: options.creator,
        target: options.target,
        closedBy: options.closedBy,
        openedAt: options.openedAt.toISOString(),
        closedAt: options.closedAt.toISOString(),
        durationSeconds: formatDurationSeconds(options.openedAt, options.closedAt),
        modsInvolved,
        messages,
    };
    return {
        data,
        modIds,
    };
}
export { truncateSnippet as truncateReplySnippet, };
