import { getHouseRoleId, } from "../services/guildSettingsService.js";
export const HOUSE_GRYFFINDOR = "gryffindor";
export const HOUSE_RAVENCLAW = "ravenclaw";
export const HOUSE_HUFFLEPUFF = "hufflepuff";
export const HOUSE_SLYTHERIN = "slytherin";
export async function getMemberHouse(member) {
    const guildId = member.guild.id;
    const gryffindorRoleId = await getHouseRoleId(guildId, HOUSE_GRYFFINDOR);
    if (gryffindorRoleId &&
        member.roles.cache.has(gryffindorRoleId)) {
        return HOUSE_GRYFFINDOR;
    }
    const ravenclawRoleId = await getHouseRoleId(guildId, HOUSE_RAVENCLAW);
    if (ravenclawRoleId &&
        member.roles.cache.has(ravenclawRoleId)) {
        return HOUSE_RAVENCLAW;
    }
    const hufflepuffRoleId = await getHouseRoleId(guildId, HOUSE_HUFFLEPUFF);
    if (hufflepuffRoleId &&
        member.roles.cache.has(hufflepuffRoleId)) {
        return HOUSE_HUFFLEPUFF;
    }
    const slytherinRoleId = await getHouseRoleId(guildId, HOUSE_SLYTHERIN);
    if (slytherinRoleId &&
        member.roles.cache.has(slytherinRoleId)) {
        return HOUSE_SLYTHERIN;
    }
    return null;
}
/** Hard-coded fallback used when a guild hasn't configured a custom emoji
 * for a house yet (see houseConfigService.ts, which is what everything
 * displaying a house emoji should actually call). */
export function getDefaultHouseEmoji(houseName) {
    switch (houseName) {
        case HOUSE_GRYFFINDOR:
            return "🦁";
        case HOUSE_RAVENCLAW:
            return "🦅";
        case HOUSE_HUFFLEPUFF:
            return "🦡";
        case HOUSE_SLYTHERIN:
            return "🐍";
    }
}
export function getHouseDisplayName(houseName) {
    switch (houseName) {
        case HOUSE_GRYFFINDOR:
            return "Gryffindor";
        case HOUSE_RAVENCLAW:
            return "Ravenclaw";
        case HOUSE_HUFFLEPUFF:
            return "Hufflepuff";
        case HOUSE_SLYTHERIN:
            return "Slytherin";
    }
}
