import { EmbedBuilder, GuildMember, } from "discord.js";
import { EMBED_COLOR, } from "../../config/constants.js";
import { sendLog, } from "../../services/logService.js";
import { incrementLeave, } from "../../services/analyticsTracker.js";
export async function handleMemberJoinLog(member) {
    try {
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle("👋 Member Joined")
            .setDescription(`${member} joined the server.`)
            .addFields({
            name: "User",
            value: `${member.user.tag}\n(${member.id})`,
        }, {
            name: "Account Created",
            value: `<t:${Math.floor(member.user.createdTimestamp /
                1000)}:R>`,
            inline: true,
        }, {
            name: "Member Count",
            value: member.guild.memberCount.toString(),
            inline: true,
        })
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();
        await sendLog(member.guild, embed);
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ Member join log error:", error);
    }
}
export async function handleMemberLeaveLog(member) {
    try {
        if (!(member instanceof GuildMember)) {
            return;
        }
        if (!member.user.bot) {
            incrementLeave(member.guild.id);
        }
        const joinedAt = member.joinedTimestamp
            ? `<t:${Math.floor(member.joinedTimestamp /
                1000)}:R>`
            : "Unknown";
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle("🚪 Member Left")
            .setDescription(`${member.user.tag} left the server.`)
            .addFields({
            name: "User",
            value: `${member.user.tag}\n(${member.id})`,
        }, {
            name: "Joined Server",
            value: joinedAt,
            inline: true,
        }, {
            name: "Member Count",
            value: member.guild.memberCount.toString(),
            inline: true,
        })
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();
        await sendLog(member.guild, embed);
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ Member leave log error:", error);
    }
}
