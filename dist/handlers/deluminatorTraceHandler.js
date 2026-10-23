import { saveTrace, } from "../services/deluminatorTraceService.js";
export async function handleDeluminatorTrace(message) {
    if (message.author.bot ||
        !message.guild) {
        return;
    }
    let preview = message.content.trim();
    if (!preview) {
        if (message.attachments.size > 0) {
            preview =
                "📎 Attachment";
        }
        else if (message.embeds.length > 0) {
            preview =
                "🎞️ Shared media";
        }
        else if (message.stickers.size > 0) {
            preview =
                "🏷️ Sticker";
        }
        else {
            preview =
                "Unknown content";
        }
    }
    if (preview.length > 200) {
        preview =
            `${preview.slice(0, 197)}...`;
    }
    console.log("[Deluminator] Saving trace:", {
        user: message.author.username,
        channel: message.channel.id,
        message: message.id,
        preview,
    });
    saveTrace(message.guild.id, message.author.id, message.channel.id, message.id, preview, message.createdTimestamp);
}
