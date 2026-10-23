import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, TextChannel, } from "discord.js";
import { EMBED_COLOR, } from "../config/constants.js";
import { areInterviewsEnabled, getInterviewLogChannel, } from "../services/guildSettingsService.js";
import { closeInterview, getInterviewByChannelId, setInterviewLogMessageId, } from "../services/interviewService.js";
import { buildInterviewTranscript, truncateReplySnippet, } from "../services/transcriptService.js";
import { isBotManager, } from "../utils/permissions.js";
const CHANNEL_DELETE_DELAY_MS = 10_000;
/** Fetches every message in the channel, oldest first. */
async function fetchAllMessages(channel) {
    const collected = [];
    let before;
    for (let page = 0; page < 50; page++) {
        const batch = await channel.messages.fetch({
            limit: 100,
            before,
        });
        if (batch.size === 0) {
            break;
        }
        for (const message of batch.values()) {
            collected.push({
                id: message.id,
                authorId: message.author.id,
                authorTag: message.author.tag ??
                    message.author.username,
                displayName: message.member?.displayName ??
                    message.author.globalName ??
                    message.author.username,
                avatarUrl: message.author.displayAvatarURL({
                    extension: "png",
                    size: 64,
                }),
                content: message.content,
                createdAt: message.createdAt,
                attachmentUrls: [
                    ...message.attachments.values(),
                ].map((attachment) => attachment.url),
                isBotAuthor: message.author.bot,
                referenceMessageId: message.reference?.messageId ??
                    null,
            });
        }
        before =
            batch.last()?.id;
        if (batch.size < 100) {
            break;
        }
    }
    return collected.reverse();
}
/** Resolves each message's reply reference (if any) against the full set of
 *  messages fetched for this channel. A reply target that isn't found in
 *  that set (deleted before close, or otherwise unavailable) is still
 *  surfaced with `isUnknown: true` rather than dropped, so the transcript
 *  shows "replying to a message" instead of silently losing the context. */
function resolveReplyRef(referenceMessageId, byId) {
    if (!referenceMessageId) {
        return null;
    }
    const original = byId.get(referenceMessageId);
    if (!original) {
        return {
            messageId: referenceMessageId,
            authorId: "",
            authorTag: "",
            displayName: "",
            snippet: "",
            isUnknown: true,
        };
    }
    return {
        messageId: original.id,
        authorId: original.authorId,
        authorTag: original.authorTag,
        displayName: original.displayName,
        snippet: truncateReplySnippet(original.content),
        isUnknown: false,
    };
}
export async function closeInterviewCommand(interaction) {
    if (!interaction.guild ||
        !(interaction.channel instanceof TextChannel)) {
        await interaction.reply({
            content: "❌ This command can only be used inside an interview channel.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    const guild = interaction.guild;
    const channel = interaction.channel;
    const moderator = await guild.members.fetch(interaction.user.id);
    if (!(await isBotManager(moderator))) {
        await interaction.reply({
            content: "❌ You do not have permission to use this command.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    if (!(await areInterviewsEnabled(guild.id))) {
        await interaction.reply({
            content: "❌ Interviews are not enabled for this server.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    const interview = await getInterviewByChannelId(channel.id);
    if (!interview ||
        interview.status !== "open") {
        await interaction.reply({
            content: "❌ This channel isn't an open interview.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    await interaction.deferReply();
    const rawMessages = await fetchAllMessages(channel);
    const rawMessagesById = new Map(rawMessages.map((message) => [
        message.id,
        message,
    ]));
    const transcriptMessages = rawMessages
        .filter((message) => !message.isBotAuthor)
        .map((message) => ({
        id: message.id,
        authorId: message.authorId,
        authorTag: message.authorTag,
        displayName: message.displayName,
        avatarUrl: message.avatarUrl,
        isTarget: message.authorId ===
            interview.targetUserId,
        content: message.content,
        createdAt: message.createdAt,
        attachmentUrls: message.attachmentUrls,
        replyTo: resolveReplyRef(message.referenceMessageId, rawMessagesById),
    }));
    const [creatorMember, targetMember,] = await Promise.all([
        guild.members
            .fetch(interview.creatorId)
            .catch(() => null),
        guild.members
            .fetch(interview.targetUserId)
            .catch(() => null),
    ]);
    const closedAt = new Date();
    const { data: transcriptData, modIds, } = buildInterviewTranscript({
        guildName: guild.name,
        channelName: channel.name,
        interviewNumber: interview.number,
        creator: {
            id: interview.creatorId,
            tag: creatorMember?.user.tag ??
                interview.creatorId,
        },
        target: {
            id: interview.targetUserId,
            tag: targetMember?.user.tag ??
                interview.targetUserId,
        },
        closedBy: {
            id: moderator.id,
            tag: moderator.user.tag,
        },
        openedAt: interview.openedAt,
        closedAt,
        messages: transcriptMessages,
    });
    const updated = await closeInterview(interview.id, moderator.id, modIds, transcriptData);
    const logChannelId = await getInterviewLogChannel(guild.id);
    const logChannel = logChannelId
        ? guild.channels.cache.get(logChannelId)
        : null;
    if (logChannel instanceof TextChannel) {
        const dashboardUrl = (process.env.DASHBOARD_URL ?? "").replace(/\/+$/, "");
        const modsInvolvedText = modIds.length > 0
            ? modIds
                .map((id) => `<@${id}>`)
                .join(", ")
            : "*none*";
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle(`📄 Interview #${interview.number} closed`)
            .addFields({
            name: "Interviewee",
            value: `<@${interview.targetUserId}>`,
            inline: true,
        }, {
            name: "Opened by",
            value: `<@${interview.creatorId}>`,
            inline: true,
        }, {
            name: "Closed by",
            value: `<@${moderator.id}>`,
            inline: true,
        }, {
            name: "Mods involved",
            value: modsInvolvedText,
        })
            .setTimestamp(closedAt);
        const row = new ActionRowBuilder();
        if (dashboardUrl) {
            row.addComponents(new ButtonBuilder()
                .setLabel("Read Transcript")
                .setStyle(ButtonStyle.Link)
                .setURL(`${dashboardUrl}/interviews/${updated.publicId}`));
        }
        const logMessage = await logChannel.send({
            embeds: [
                embed,
            ],
            components: row.components.length > 0
                ? [
                    row,
                ]
                : [],
        });
        await setInterviewLogMessageId(interview.id, logMessage.id);
    }
    await interaction.editReply({
        content: logChannel instanceof TextChannel
            ? "✅ Interview closed. Transcript saved and posted to the interview log. This channel will be deleted shortly."
            : "✅ Interview closed. Transcript saved. This channel will be deleted shortly.\n⚠️ No interview log channel is configured — set one from the dashboard.",
    });
    setTimeout(() => {
        channel
            .delete(`Interview #${interview.number} closed by ${moderator.user.tag}`)
            .catch((error) => {
            console.error("[DumbledoreBot] ❌ Failed to delete interview channel:", error);
        });
    }, CHANNEL_DELETE_DELAY_MS);
}
