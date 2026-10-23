import { EmbedBuilder, TextChannel, } from "discord.js";
import { EMBED_COLOR, } from "../../config/constants.js";
import { sendLog, } from "../../services/logService.js";
export async function handleMessageDelete(message) {
    try {
        if (message.partial) {
            await message.fetch();
        }
        if (!message.guild ||
            !message.author ||
            message.author.bot) {
            return;
        }
        let content = (message.content ?? "")
            .trim();
        if (content.length === 0) {
            if (message.attachments.size > 0) {
                content =
                    "📎 Attachment";
            }
            else if (message.embeds.length > 0) {
                content =
                    "🎞️ Embedded content";
            }
            else if (message.stickers.size > 0) {
                content =
                    "🏷️ Sticker";
            }
            else {
                content =
                    "[No content]";
            }
        }
        if (content.length > 4096) {
            content =
                `${content.slice(0, 4093)}...`;
        }
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle(`🗑️ Message Deleted in ${message.channel instanceof
            TextChannel
            ? `#${message.channel.name}`
            : "Unknown Channel"}`)
            .setDescription(content)
            .setAuthor({
            name: message.member
                ?.displayName ??
                message.author.username,
            iconURL: message.author.displayAvatarURL(),
        })
            .setTimestamp();
        const imageAttachment = message.attachments.find(attachment => attachment.contentType?.startsWith("image/"));
        if (imageAttachment) {
            embed.setImage(imageAttachment.url);
        }
        await sendLog(message.guild, embed);
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ Message delete log error:", error);
    }
}
export async function handleMessageUpdate(oldMessage, newMessage) {
    try {
        if (oldMessage.partial) {
            await oldMessage.fetch();
        }
        if (newMessage.partial) {
            await newMessage.fetch();
        }
        if (!newMessage.guild ||
            !newMessage.author ||
            newMessage.author.bot) {
            return;
        }
        const before = oldMessage.content?.trim() ??
            "";
        const after = newMessage.content?.trim() ??
            "";
        if (before === after) {
            return;
        }
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle(`✏️ Message Edited in ${newMessage.channel instanceof
            TextChannel
            ? `#${newMessage.channel.name}`
            : "Unknown Channel"}`)
            .addFields({
            name: "Before",
            value: before.length > 0
                ? before.slice(0, 1024)
                : "[Empty]",
        }, {
            name: "After",
            value: after.length > 0
                ? after.slice(0, 1024)
                : "[Empty]",
        })
            .setAuthor({
            name: newMessage.member
                ?.displayName ??
                newMessage.author.username,
            iconURL: newMessage.author.displayAvatarURL(),
        })
            .setTimestamp();
        await sendLog(newMessage.guild, embed);
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ Message update log error:", error);
    }
}
