import { ChannelType, EmbedBuilder, } from "discord.js";
import { EMBED_COLOR, STAR_EMOJI, } from "../config/constants.js";
import { getStarboardChannel, getStarboardThreshold, getStarXpValue, isHouseCupEnabled, isStarboardEnabled, } from "../services/guildSettingsService.js";
import { addHouseXp, } from "../services/houseXpService.js";
import { addXp, } from "../services/userService.js";
import { createStarboardMessage, deleteStarboardMessage, getStarboardMessage, updateStarCount, } from "../services/starboardService.js";
import { getMemberHouse, } from "../utils/house.js";
/**
 * Awards (or, for reaction-remove, reverts) star XP to a message's
 * author, crediting whichever house they currently belong to (if any).
 * Gated on the House Cup toggle so star-reaction XP and message XP turn
 * off together; independent of whether starboard posting itself
 * succeeds, so a message author with no house role still earns XP - they
 * just don't contribute to any house's average.
 */
async function awardStarXp(message, sign) {
    if (!message.guild ||
        !message.author) {
        return;
    }
    if (!(await isHouseCupEnabled(message.guild.id))) {
        return;
    }
    const starXpValue = await getStarXpValue(message.guild.id);
    const delta = sign * starXpValue;
    await addXp(message.guild.id, message.author.id, delta);
    const member = await message.guild.members
        .fetch(message.author.id)
        .catch(() => null);
    if (!member) {
        return;
    }
    const house = await getMemberHouse(member);
    if (!house) {
        return;
    }
    await addHouseXp(message.guild.id, message.author.id, house, delta);
}
async function fetchReaction(reaction) {
    if (reaction.partial) {
        return await reaction.fetch();
    }
    return reaction;
}
function isStarReaction(reaction) {
    return (reaction.emoji.name ===
        STAR_EMOJI);
}
async function getStarCount(reaction) {
    return (reaction.count ?? 0);
}
export async function handleStarReactionAdd(reaction, user) {
    try {
        const fetchedReaction = await fetchReaction(reaction);
        if (!isStarReaction(fetchedReaction)) {
            return;
        }
        const message = fetchedReaction.message;
        if (!message.guild ||
            user.bot) {
            return;
        }
        if (!await isStarboardEnabled(message.guild.id)) {
            return;
        }
        const starboardChannelId = await getStarboardChannel(message.guild.id);
        if (!starboardChannelId) {
            return;
        }
        if (user.id ===
            message.author?.id ||
            !message.author) {
            return;
        }
        // Awarding XP for the star is independent of whether the author
        // has a house role - it just won't count towards any house's
        // House Cup average if they don't. It also doesn't gate the
        // starboard post itself below.
        await awardStarXp(message, 1);
        const starCount = await getStarCount(fetchedReaction);
        const starboardChannel = await message.guild.channels.fetch(starboardChannelId);
        if (!starboardChannel ||
            starboardChannel.type !==
                ChannelType.GuildText) {
            return;
        }
        const existing = await getStarboardMessage(message.id);
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setAuthor({
            name: message.author?.tag ??
                "Unknown User",
            iconURL: message.author?.displayAvatarURL(),
        })
            .setDescription(`${message.content || "*No text content*"}

[Jump to Message](${message.url})`)
            .setTimestamp(message.createdAt);
        const imageAttachment = message.attachments.find((attachment) => attachment.contentType?.startsWith("image/"));
        if (imageAttachment) {
            embed.setImage(imageAttachment.url);
        }
        const channel = starboardChannel;
        if (starCount <
            (await getStarboardThreshold(message.guild.id))) {
            return;
        }
        if (!existing) {
            const starboardMessage = await channel.send({
                content: `⭐ ${starCount} | ${message.channel}`,
                embeds: [
                    embed,
                ],
            });
            await createStarboardMessage(message.id, message.guild.id, message.author?.id ??
                "", starboardMessage.id, starCount);
            return;
        }
        const starboardMessage = await channel.messages.fetch(existing.starboardMessageId);
        await starboardMessage.edit({
            content: `⭐ ${starCount} | ${message.channel}`,
            embeds: [
                embed,
            ],
        });
        await updateStarCount(message.id, starCount);
    }
    catch (error) {
        console.error("[DumbledoreBot] Starboard add error:", error);
    }
}
export async function handleStarReactionRemove(reaction, user) {
    try {
        const fetchedReaction = await fetchReaction(reaction);
        if (!isStarReaction(fetchedReaction)) {
            return;
        }
        const message = fetchedReaction.message;
        if (!message.guild ||
            user.bot) {
            return;
        }
        if (!await isStarboardEnabled(message.guild.id)) {
            return;
        }
        const starboardChannelId = await getStarboardChannel(message.guild.id);
        if (!starboardChannelId) {
            return;
        }
        if (user.id ===
            message.author?.id ||
            !message.author) {
            return;
        }
        await awardStarXp(message, -1);
        const existing = await getStarboardMessage(message.id);
        if (!existing) {
            return;
        }
        const starCount = await getStarCount(fetchedReaction);
        const channel = await message.guild.channels.fetch(starboardChannelId);
        if (!channel ||
            channel.type !==
                ChannelType.GuildText) {
            return;
        }
        const textChannel = channel;
        const starboardMessage = await textChannel.messages.fetch(existing.starboardMessageId);
        if (starCount <
            (await getStarboardThreshold(message.guild.id))) {
            await starboardMessage.delete();
            await deleteStarboardMessage(message.id);
            return;
        }
        await starboardMessage.edit({
            content: `⭐ ${starCount} | ${message.channel}`,
        });
        await updateStarCount(message.id, starCount);
    }
    catch (error) {
        console.error("[DumbledoreBot] Starboard remove error:", error);
    }
}
