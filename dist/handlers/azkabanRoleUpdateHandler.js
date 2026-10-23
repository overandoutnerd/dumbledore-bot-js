import { getAzkabanRole, isAzkabanEnabled, } from "../services/guildSettingsService.js";
import { getCategories, } from "../services/categoryService.js";
import { getRoleIdsForCategory, } from "../services/optionService.js";
export async function handleAzkabanRoleUpdate(oldMember, newMember) {
    if (oldMember.partial ||
        newMember.partial) {
        return;
    }
    const guildId = newMember.guild.id;
    const enabled = await isAzkabanEnabled(guildId);
    if (!enabled) {
        return;
    }
    const azkabanRoleId = await getAzkabanRole(guildId);
    if (!azkabanRoleId) {
        return;
    }
    const hadAzkabanRole = oldMember.roles.cache.has(azkabanRoleId);
    const hasAzkabanRole = newMember.roles.cache.has(azkabanRoleId);
    if (hadAzkabanRole ||
        !hasAzkabanRole) {
        return;
    }
    const categories = await getCategories(guildId);
    const roleIds = new Set();
    for (const category of categories) {
        const ids = await getRoleIdsForCategory(category.id);
        for (const id of ids) {
            roleIds.add(id);
        }
    }
    const rolesToRemove = newMember.roles.cache.filter(role => roleIds.has(role.id));
    if (rolesToRemove.size === 0) {
        return;
    }
    await newMember.roles.remove([
        ...rolesToRemove.keys(),
    ], "Member sent to Azkaban");
    console.log(`[DumbledoreBot] 🏰 Removed ${rolesToRemove.size} self-assignable role(s) from ${newMember.user.tag}`);
}
