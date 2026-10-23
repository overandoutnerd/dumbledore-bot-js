import { MessageFlags, TextChannel, } from "discord.js";
import { getHouseCupChannel, isHouseCupEnabled, } from "../services/guildSettingsService.js";
import { getHouseCupBoard, postHouseCupBoard, refreshHouseCupBoard, } from "../services/houseCupBoardService.js";
import { isBotManager, } from "../utils/permissions.js";
/**
 * Mods-only. Posts (or, if one already exists, edits in place) the House
 * Cup standings board in the guild's configured house_cup_channel_id -
 * NOT necessarily the channel this command is run from, same as
 * /configure-starboard etc. See houseCupBoardScheduler.ts for how it
 * keeps refreshing afterwards without needing this command re-run.
 */
export async function executeHouseCup(interaction) {
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
    if (!(await isHouseCupEnabled(interaction.guild.id))) {
        await interaction.reply({
            content: "🏆 The House Cup is currently disabled on this server. Enable it from the dashboard or with `/configure-house-cup` first.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    const channelId = await getHouseCupChannel(interaction.guild.id);
    if (!channelId) {
        await interaction.reply({
            content: "❌ No House Cup channel is configured yet. Use `/configure-house-cup` (or the dashboard) to set one.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    const channel = await interaction.guild.channels
        .fetch(channelId)
        .catch(() => null);
    if (!channel ||
        !(channel instanceof TextChannel)) {
        await interaction.reply({
            content: "❌ The configured House Cup channel no longer exists. Set a new one with `/configure-house-cup`.",
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
    const existingBoard = await getHouseCupBoard(interaction.guild.id);
    // Same channel as last time - edit that message in place instead of
    // posting a duplicate.
    if (existingBoard &&
        existingBoard.channelId ===
            channel.id) {
        const refreshed = await refreshHouseCupBoard(interaction.guild);
        if (refreshed) {
            await interaction.editReply({
                content: `✅ House Cup board updated in ${channel}.`,
            });
            return;
        }
        // The old message was deleted out from under us - fall through
        // and post a fresh one below.
    }
    await postHouseCupBoard(interaction.guild, channel);
    await interaction.editReply({
        content: `✅ House Cup board posted in ${channel}. It'll keep itself up to date automatically.`,
    });
}
