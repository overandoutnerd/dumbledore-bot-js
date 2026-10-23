import { PermissionFlagsBits, TextChannel, } from "discord.js";
export async function findLatestMessage(guild, userId, canSeeModChannels, modChannelIds) {
    let latestResult = null;
    const channels = guild.channels.cache.filter((channel) => channel instanceof
        TextChannel);
    for (const channel of channels.values()) {
        if (!canSeeModChannels &&
            modChannelIds.includes(channel.id)) {
            continue;
        }
        const permissions = channel.permissionsFor(guild.members.me);
        if (!permissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
        ])) {
            continue;
        }
        let before;
        for (let page = 0; page < 10; page++) {
            try {
                const messages = await channel.messages.fetch({
                    limit: 100,
                    before,
                });
                if (messages.size ===
                    0) {
                    break;
                }
                const match = messages.find((message) => message.author.id ===
                    userId);
                if (match) {
                    const preview = match.content.trim()
                        .length > 0
                        ? match.content.slice(0, 200)
                        : "[Attachment]";
                    if (!latestResult ||
                        match.createdTimestamp >
                            latestResult
                                .message
                                .createdTimestamp) {
                        latestResult = {
                            message: match,
                            channel,
                            preview,
                        };
                    }
                    break;
                }
                if (messages.size <
                    100) {
                    break;
                }
                before =
                    messages.last()
                        ?.id;
            }
            catch (error) {
                console.error(`[Deluminator] Failed to search #${channel.name}`, error);
                break;
            }
        }
    }
    return latestResult;
}
