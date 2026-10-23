import { EmbedBuilder, } from "discord.js";
import { EMBED_COLOR, } from "../../config/constants.js";
import { sendLog, } from "../../services/logService.js";
export async function handleRoleUpdateLog(oldMember, newMember) {
    try {
        if (oldMember.partial) {
            return;
        }
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
        if (addedRoles.size === 0 &&
            removedRoles.size === 0) {
            return;
        }
        for (const role of addedRoles.values()) {
            const embed = new EmbedBuilder()
                .setColor(EMBED_COLOR)
                .setTitle("🎭 Role Added")
                .setAuthor({
                name: newMember.displayName,
                iconURL: newMember.user.displayAvatarURL(),
            })
                .setDescription(role.toString())
                .setFooter({
                text: `ID: ${newMember.id}`,
            })
                .setTimestamp();
            await sendLog(newMember.guild, embed);
        }
        for (const role of removedRoles.values()) {
            const embed = new EmbedBuilder()
                .setColor(EMBED_COLOR)
                .setTitle("🎭 Role Removed")
                .setAuthor({
                name: newMember.displayName,
                iconURL: newMember.user.displayAvatarURL(),
            })
                .setDescription(role.toString())
                .setFooter({
                text: `ID: ${newMember.id}`,
            })
                .setTimestamp();
            await sendLog(newMember.guild, embed);
        }
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ Role update log error:", error);
    }
}
