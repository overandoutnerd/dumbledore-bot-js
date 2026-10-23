import { buildGuildSettingsDashboard, } from "../utils/guildSettingsDashboard.js";
import { isBotManager, } from "../utils/permissions.js";
export async function guildSettingsCommand(interaction) {
    if (!interaction.guild) {
        await interaction.reply({
            content: "❌ This command can only be used in a server.",
            ephemeral: true,
        });
        return;
    }
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!(await isBotManager(member))) {
        await interaction.reply({
            content: "❌ You do not have permission to use this command.",
            ephemeral: true,
        });
        return;
    }
    const dashboard = await buildGuildSettingsDashboard(interaction.guild.id, "main");
    await interaction.reply({
        ...dashboard,
        ephemeral: true,
    });
}
