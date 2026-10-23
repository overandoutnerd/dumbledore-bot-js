import { TextChannel, } from "discord.js";
import { areLogsEnabled, getLogChannel, } from "./guildSettingsService.js";
export async function sendLog(guild, embed) {
    try {
        if (!areLogsEnabled(guild.id)) {
            return;
        }
        const channelId = await getLogChannel(guild.id);
        if (!channelId) {
            return;
        }
        const channel = await guild.channels.fetch(channelId);
        if (!channel ||
            !(channel instanceof TextChannel)) {
            console.error("[DumbledoreBot] ❌ Log channel not found.");
            return;
        }
        await channel.send({
            embeds: [embed],
        });
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ Failed to send log:", error);
    }
}
