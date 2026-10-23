import { MessageFlags, } from "discord.js";
import { deleteOption, getOptionById, } from "../../services/optionService.js";
import { updateDashboardState, } from "../../services/adminDashboardService.js";
import { refreshAdminDashboard, } from "../../utils/refreshDashboard.js";
export async function handleDeleteOptionButton(interaction) {
    if (!interaction.customId.startsWith("configure_admin_delete_option:")) {
        return;
    }
    const optionId = Number(interaction.customId.split(":")[1]);
    if (Number.isNaN(optionId)) {
        return;
    }
    const option = await getOptionById(optionId);
    if (!option) {
        await interaction.reply({
            content: "❌ Option not found.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    deleteOption(optionId);
    updateDashboardState(interaction.guildId, {
        screen: "options",
        selectedCategoryId: option.categoryId,
        selectedOptionId: undefined,
    });
    await refreshAdminDashboard(interaction.client, interaction.guild.id);
    await interaction.reply({
        content: `✅ Deleted option "${option.label}".`,
        flags: [
            MessageFlags.Ephemeral,
        ],
    });
}
