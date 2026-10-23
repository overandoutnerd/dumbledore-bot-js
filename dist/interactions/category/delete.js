import { MessageFlags, } from "discord.js";
import { deleteCategory, getCategoryById, } from "../../services/categoryService.js";
import { updateDashboardState, } from "../../services/adminDashboardService.js";
import { refreshAdminDashboard, } from "../../utils/refreshDashboard.js";
export async function handleDeleteCategoryButton(interaction) {
    if (!interaction.customId.startsWith("configure_admin_delete_category:")) {
        return;
    }
    const categoryId = Number(interaction.customId.split(":")[1]);
    if (Number.isNaN(categoryId)) {
        await interaction.reply({
            content: "❌ Invalid category.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    const category = await getCategoryById(categoryId);
    if (!category) {
        await interaction.reply({
            content: "❌ Category not found.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    deleteCategory(categoryId);
    updateDashboardState(interaction.guildId, {
        screen: "categories",
        selectedCategoryId: undefined,
        selectedOptionId: undefined,
    });
    await refreshAdminDashboard(interaction.client, interaction.guild.id);
    await interaction.reply({
        content: `✅ Category "${category.title}" deleted successfully.`,
        flags: [
            MessageFlags.Ephemeral,
        ],
    });
}
