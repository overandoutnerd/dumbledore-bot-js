import { LabelBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, } from "discord.js";
import { categoryExists, createCategory, } from "../../services/categoryService.js";
import { refreshAdminDashboard, } from "../../utils/refreshDashboard.js";
import { buildEmojiSelectMenu, resolveEmojiSelection, } from "../../utils/emojiPicker.js";
export async function handleAddCategoryButton(interaction) {
    if (interaction.customId !==
        "configure_admin_add_category") {
        return;
    }
    if (!interaction.inCachedGuild()) {
        return;
    }
    const modal = new ModalBuilder()
        .setCustomId("configure_admin_add_category_modal")
        .setTitle("Add Category");
    const nameInput = new TextInputBuilder()
        .setCustomId("name")
        .setRequired(true)
        .setStyle(TextInputStyle.Short)
        .setMaxLength(50);
    const nameLabel = new LabelBuilder()
        .setLabel("Category Name")
        .setTextInputComponent(nameInput);
    const titleInput = new TextInputBuilder()
        .setCustomId("title")
        .setRequired(true)
        .setStyle(TextInputStyle.Short)
        .setMaxLength(100);
    const titleLabel = new LabelBuilder()
        .setLabel("Display Title")
        .setTextInputComponent(titleInput);
    const descriptionInput = new TextInputBuilder()
        .setCustomId("description")
        .setRequired(true)
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(500);
    const descriptionLabel = new LabelBuilder()
        .setLabel("Description")
        .setTextInputComponent(descriptionInput);
    const emojiSelect = await buildEmojiSelectMenu(interaction.guild, "emoji");
    const emojiLabel = new LabelBuilder()
        .setLabel("Emoji (optional)")
        .setDescription("Pick from this server's custom emojis")
        .setStringSelectMenuComponent(emojiSelect);
    modal.addLabelComponents(nameLabel, titleLabel, descriptionLabel, emojiLabel);
    await interaction.showModal(modal);
}
export async function handleAddCategoryModal(interaction) {
    if (interaction.customId !==
        "configure_admin_add_category_modal") {
        return;
    }
    if (!interaction.inCachedGuild()) {
        return;
    }
    const name = interaction.fields
        .getTextInputValue("name")
        .trim()
        .toLowerCase()
        .replaceAll(" ", "_");
    const title = interaction.fields
        .getTextInputValue("title")
        .trim();
    const description = interaction.fields
        .getTextInputValue("description")
        .trim();
    const emoji = resolveEmojiSelection([
        ...interaction.fields.getStringSelectValues("emoji"),
    ]);
    if (name.length < 2) {
        await interaction.reply({
            content: "❌ Category name must be at least 2 characters.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    if (await categoryExists(interaction.guild.id, name)) {
        await interaction.reply({
            content: "❌ A category with that name already exists.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    createCategory(interaction.guild.id, name, title, description, emoji, "single");
    await refreshAdminDashboard(interaction.client, interaction.guild.id);
    await interaction.reply({
        content: `✅ Category "${title}" created successfully.`,
        flags: [
            MessageFlags.Ephemeral,
        ],
    });
}
