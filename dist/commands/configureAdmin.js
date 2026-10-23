import { MessageFlags, } from "discord.js";
import { isBotManager, } from "../utils/permissions.js";
import { buildAdminDashboard, } from "../utils/adminDashboard.js";
import { saveDashboard, } from "../services/adminDashboardService.js";
export async function executeConfigureAdmin(interaction) {
    if (!interaction.inCachedGuild()) {
        return;
    }
    const hasPermission = await isBotManager(interaction.member);
    if (!hasPermission) {
        await interaction.reply({
            content: "❌ You do not have permission to use this command.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    const dashboard = await buildAdminDashboard(interaction.guild.id);
    const message = await interaction.reply({
        ...dashboard,
        fetchReply: true,
    });
    saveDashboard(interaction.guild.id, interaction.channelId, message.id);
}
