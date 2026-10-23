import { MessageFlags, } from "discord.js";
import { addHousePoints, getHousePoints, logHousePointsAward, } from "../services/housePointsService.js";
import { getHouseEmoji, } from "../services/houseConfigService.js";
import { refreshHouseCupBoard, } from "../services/houseCupBoardService.js";
import { getHouseDisplayName, } from "../utils/house.js";
import { isBotManager, } from "../utils/permissions.js";
/**
 * Mods only. Awards (positive amount) or deducts (negative amount) House
 * Cup bonus points, same underlying mechanism as the dashboard's award
 * form - a reason is required either way, and it gets logged to
 * guild_settings.house_cup_log_channel_id exactly like a dashboard award
 * does, so there's one consistent trail no matter which side awarded it.
 */
export async function executeHousePoints(interaction) {
    if (!interaction.inCachedGuild()) {
        return;
    }
    if (!(await isBotManager(interaction.member))) {
        await interaction.reply({
            content: "❌ You do not have permission to use this command.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    const house = interaction.options.getString("house", true);
    const amount = interaction.options.getInteger("amount", true);
    const reason = interaction.options
        .getString("reason", true)
        .trim();
    if (amount === 0) {
        await interaction.reply({
            content: "❌ Amount can't be zero.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    if (reason.length === 0) {
        await interaction.reply({
            content: "❌ Please give a reason for this award.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    await interaction.deferReply({
        flags: [
            MessageFlags.Ephemeral,
        ],
    });
    await addHousePoints(interaction.guild.id, house, amount);
    const newTotal = await getHousePoints(interaction.guild.id, house);
    await logHousePointsAward(interaction.guild, {
        moderator: interaction.user,
        house,
        delta: amount,
        reason,
        newTotal,
    });
    // Best-effort - if there's no board posted yet this just no-ops.
    await refreshHouseCupBoard(interaction.guild).catch(() => { });
    const emoji = await getHouseEmoji(interaction.guild.id, house);
    const sign = amount > 0
        ? "+"
        : "";
    await interaction.editReply({
        content: `✅ ${sign}${amount} bonus points for ${emoji} ${getHouseDisplayName(house)} (now ${newTotal} bonus). Reason: ${reason}`,
    });
}
