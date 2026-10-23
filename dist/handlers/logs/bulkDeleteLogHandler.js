import { EmbedBuilder, TextChannel, } from "discord.js";
import { EMBED_COLOR, } from "../../config/constants.js";
import { sendLog, } from "../../services/logService.js";
export async function handleBulkDeleteLog(messages, channel) {
    try {
        if (messages.size === 0) {
            return;
        }
        const firstMessage = messages.first();
        if (!firstMessage) {
            return;
        }
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle("🧹 Messages Purged")
            .addFields({
            name: "Channel",
            value: channel instanceof
                TextChannel
                ? `#${channel.name}`
                : channel.toString(),
            inline: true,
        }, {
            name: "Messages Deleted",
            value: messages.size.toString(),
            inline: true,
        })
            .setTimestamp();
        const sampleMessages = Array.from(messages.values())
            .filter(message => !message.partial &&
            message.content.length > 0)
            .slice(0, 5);
        if (sampleMessages.length > 0) {
            const preview = sampleMessages
                .map(message => `${message.author?.username ?? "Unknown"}: ${message.content}`)
                .join("\n")
                .slice(0, 1024);
            embed.addFields({
                name: "Preview",
                value: preview,
            });
        }
        await sendLog(firstMessage.guild, embed);
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ Bulk delete log error:", error);
    }
}
