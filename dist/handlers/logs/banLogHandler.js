import { EmbedBuilder, } from "discord.js";
import { EMBED_COLOR, } from "../../config/constants.js";
import { sendLog, } from "../../services/logService.js";
export async function handleBanLog(ban) {
    try {
        console.log("[DumbledoreBot] guildBanAdd fired", ban.user.tag);
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle("🔨 Member Banned")
            .setDescription(`${ban.user.tag} was banned.`)
            .addFields({
            name: "User",
            value: `${ban.user}\n(${ban.user.id})`,
        }, {
            name: "Account Created",
            value: `<t:${Math.floor(ban.user.createdTimestamp /
                1000)}:R>`,
            inline: true,
        }, {
            name: "Reason",
            value: ban.reason ??
                "No reason provided",
            inline: true,
        })
            .setThumbnail(ban.user.displayAvatarURL())
            .setTimestamp();
        await sendLog(ban.guild, embed);
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ Ban log error:", error);
    }
}
export async function handleUnbanLog(ban) {
    try {
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle("🔓 Member Unbanned")
            .setDescription(`${ban.user.tag} was unbanned.`)
            .addFields({
            name: "User",
            value: `${ban.user}\n(${ban.user.id})`,
        }, {
            name: "Account Created",
            value: `<t:${Math.floor(ban.user.createdTimestamp /
                1000)}:R>`,
            inline: true,
        })
            .setThumbnail(ban.user.displayAvatarURL())
            .setTimestamp();
        await sendLog(ban.guild, embed);
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ Unban log error:", error);
    }
}
