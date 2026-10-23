import { handleAddCategoryButton, handleAddCategoryModal, handleEditCategoryButton, handleEditCategoryModal, handleDeleteCategoryButton, handleCategoryDashboardButton, handleCategoryDashboardSelect, handleOptionSelectInCategoryDashboard, handleBackToCategoriesButton, } from "./category/index.js";
import { handleAddOptionButton, handleAddOptionModal, handleEditOptionButton, handleEditOptionModal, handleDeleteOptionButton, handleOptionDashboardButton, handleOptionDashboardSelect, } from "./option/index.js";
export async function handleConfigureAdminButton(interaction) {
    await handleAddCategoryButton(interaction);
    await handleEditCategoryButton(interaction);
    await handleDeleteCategoryButton(interaction);
    await handleCategoryDashboardButton(interaction);
    await handleBackToCategoriesButton(interaction);
    await handleAddOptionButton(interaction);
    await handleEditOptionButton(interaction);
    await handleDeleteOptionButton(interaction);
    await handleOptionDashboardButton(interaction);
}
export async function handleConfigureAdminSelect(interaction) {
    await handleCategoryDashboardSelect(interaction);
    await handleOptionSelectInCategoryDashboard(interaction);
    await handleOptionDashboardSelect(interaction);
}
export async function handleConfigureAdminModal(interaction) {
    await handleAddCategoryModal(interaction);
    await handleEditCategoryModal(interaction);
    await handleAddOptionModal(interaction);
    await handleEditOptionModal(interaction);
}
