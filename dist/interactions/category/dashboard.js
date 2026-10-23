import { MessageFlags, } from "discord.js";
import { getOptionById, } from "../../services/optionService.js";
import { updateDashboardState, } from "../../services/adminDashboardService.js";
import { buildAdminDashboard, } from "../../utils/adminDashboard.js";
import { buildCategoryDashboard, } from "../../utils/categoryDashboard.js";
export async function handleCategoryDashboardButton(interaction) {
    if (!interaction.customId.startsWith("configure_admin_configure_category:")) {
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
    updateDashboardState(interaction.guildId, {
        screen: "options",
        selectedCategoryId: categoryId,
        selectedOptionId: undefined,
    });
    await interaction.update(await buildCategoryDashboard(categoryId));
}
export async function handleCategoryDashboardSelect(interaction) {
    if (interaction.customId !==
        "configure_admin_category_select") {
        return;
    }
    const categoryId = Number(interaction.values[0]);
    if (Number.isNaN(categoryId)) {
        return;
    }
    updateDashboardState(interaction.guildId, {
        screen: "categories",
        selectedCategoryId: categoryId,
        selectedOptionId: undefined,
    });
    await interaction.update(await buildAdminDashboard(interaction.guildId, categoryId));
}
export async function handleOptionSelectInCategoryDashboard(interaction) {
    if (interaction.customId !==
        "configure_admin_option_select") {
        return;
    }
    const optionId = Number(interaction.values[0]);
    if (Number.isNaN(optionId)) {
        return;
    }
    const option = await getOptionById(optionId);
    if (!option) {
        return;
    }
    updateDashboardState(interaction.guildId, {
        screen: "options",
        selectedCategoryId: option.categoryId,
        selectedOptionId: optionId,
    });
    await interaction.update(await buildCategoryDashboard(option.categoryId, optionId));
}
export async function handleBackToCategoriesButton(interaction) {
    if (interaction.customId !==
        "configure_admin_back_to_categories") {
        return;
    }
    updateDashboardState(interaction.guildId, {
        screen: "categories",
        selectedCategoryId: undefined,
        selectedOptionId: undefined,
    });
    await interaction.update(await buildAdminDashboard(interaction.guildId));
}
