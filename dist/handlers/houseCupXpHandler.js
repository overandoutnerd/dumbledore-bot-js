import { getOrCreateUser, updateUser, } from "../services/userService.js";
import { getXpCooldownSeconds, getXpPerMessage, isHouseCupEnabled, } from "../services/guildSettingsService.js";
import { addHouseXp, } from "../services/houseXpService.js";
import { getMemberHouse, } from "../utils/house.js";
/**
 * Awards XP for a chat message and, if the author currently holds a
 * house role, credits that XP to their house for the House Cup. There is
 * no separate "leveling" concept anymore - XP earned here is purely a
 * House Cup input. See houseXpService.ts for how house-switching is
 * handled.
 */
export async function handleHouseCupMessageXp(message) {
    try {
        if (message.author.bot ||
            !message.guild) {
            return;
        }
        if (!(await isHouseCupEnabled(message.guild.id))) {
            return;
        }
        const user = await getOrCreateUser(message.guild.id, message.author.id);
        user.messages++;
        const cooldownSeconds = await getXpCooldownSeconds(message.guild.id);
        const onCooldown = Date.now() - user.lastXpAt <
            cooldownSeconds * 1000;
        if (onCooldown) {
            await updateUser(user);
            return;
        }
        const awardedXp = await getXpPerMessage(message.guild.id);
        user.xp +=
            awardedXp;
        user.lastXpAt =
            Date.now();
        await updateUser(user);
        console.log(`[DumbledoreBot] ⭐ +${awardedXp} XP awarded to ${message.author.tag} (${user.xp} total XP)`);
        const member = message.member ??
            (await message.guild.members
                .fetch(message.author.id)
                .catch(() => null));
        if (!member) {
            return;
        }
        const house = await getMemberHouse(member);
        if (!house) {
            return;
        }
        await addHouseXp(message.guild.id, message.author.id, house, awardedXp);
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ House Cup XP error:", error);
    }
}
