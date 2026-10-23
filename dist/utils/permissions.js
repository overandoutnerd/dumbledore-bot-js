import { PermissionFlagsBits, } from "discord.js";
import { getBotManagerRoleIds, } from "../services/guildSettingsService.js";
export async function isBotManager(member) {
    const botManagerRoleIds = await getBotManagerRoleIds(member.guild.id);
    if (botManagerRoleIds.length > 0) {
        return botManagerRoleIds.some((roleId) => member.roles.cache.has(roleId));
    }
    return member.permissions.has(PermissionFlagsBits.Administrator);
}
