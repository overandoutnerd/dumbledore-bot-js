import { LabelBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, } from "discord.js";
import { getCategoryById, updateCategory, } from "../../services/categoryService.js";
import { refreshAdminDashboard, } from "../../utils/refreshDashboard.js";
import { buildEmojiSelectMenu, resolveEmojiSelection, } from "../../utils/emojiPicker.js";
export async function handleEditCategoryButton(interaction) {
    if (!interaction.customId.startsWith("configure_admin_edit_category:")) {
        return;
    }
    if (!interaction.inCachedGuild()) {
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
    const modal = new ModalBuilder()
        .setCustomId(`configure_admin_edit_category_modal:${categoryId}`)
        .setTitle("Edit Category");
    const titleInput = new TextInputBuilder()
        .setCustomId("title")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue(category.title);
    const titleLabel = new LabelBuilder()
        .setLabel("Display Title")
        .setTextInputComponent(titleInput);
    const descriptionInput = new TextInputBuilder()
        .setCustomId("description")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setValue(category.description);
    const descriptionLabel = new LabelBuilder()
        .setLabel("Description")
        .setTextInputComponent(descriptionInput);
    const emojiSelect = await buildEmojiSelectMenu(interaction.guild, "emoji", category.emoji);
    const emojiLabel = new LabelBuilder()
        .setLabel("Emoji (optional)")
        .setDescription("Pick from this server's custom emojis")
        .setStringSelectMenuComponent(emojiSelect);
    modal.addLabelComponents(titleLabel, descriptionLabel, emojiLabel);
    await interaction.showModal(modal);
}
export async function handleEditCategoryModal(interaction) {
    if (!interaction.customId.startsWith("configure_admin_edit_category_modal:")) {
        return;
    }
    if (!interaction.inCachedGuild()) {
        return;
    }
    const categoryId = Number(interaction.customId.split(":")[1]);
    if (Number.isNaN(categoryId)) {
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
    const title = interaction.fields
        .getTextInputValue("title")
        .trim();
    const description = interaction.fields
        .getTextInputValue("description")
        .trim();
    const emoji = resolveEmojiSelection([
        ...interaction.fields.getStringSelectValues("emoji"),
    ]);
    updateCategory(categoryId, title, description, emoji);
    await refreshAdminDashboard(interaction.client, interaction.guild.id);
    await interaction.reply({
        content: `✅ Category "${title}" updated successfully.`,
        flags: [
            MessageFlags.Ephemeral,
        ],
    });
}
