import { LabelBuilder, MessageFlags, ModalBuilder, RoleSelectMenuBuilder, TextInputBuilder, TextInputStyle, } from "discord.js";
import { createOption, optionExists, } from "../../services/optionService.js";
import { getCategoryById, } from "../../services/categoryService.js";
import { refreshAdminDashboard, } from "../../utils/refreshDashboard.js";
import { buildEmojiSelectMenu, resolveEmojiSelection, } from "../../utils/emojiPicker.js";
export async function handleAddOptionButton(interaction) {
    if (!interaction.customId.startsWith("configure_admin_add_option:")) {
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
        .setCustomId(`configure_admin_add_option_modal:${categoryId}`)
        .setTitle("Add Option");
    const labelInput = new TextInputBuilder()
        .setCustomId("label")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
    const labelLabel = new LabelBuilder()
        .setLabel("Option Label")
        .setTextInputComponent(labelInput);
    const valueInput = new TextInputBuilder()
        .setCustomId("value")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
    const valueLabel = new LabelBuilder()
        .setLabel("Option Value")
        .setTextInputComponent(valueInput);
    const emojiSelect = await buildEmojiSelectMenu(interaction.guild, "emoji");
    const emojiLabel = new LabelBuilder()
        .setLabel("Emoji (optional)")
        .setDescription("Pick from this server's custom emojis")
        .setStringSelectMenuComponent(emojiSelect);
    const roleSelect = new RoleSelectMenuBuilder()
        .setCustomId("role")
        .setPlaceholder("Select the role this option grants...")
        .setRequired(true)
        .setMinValues(1)
        .setMaxValues(1);
    const roleLabel = new LabelBuilder()
        .setLabel("Role")
        .setDescription("The role this option grants when selected")
        .setRoleSelectMenuComponent(roleSelect);
    modal.addLabelComponents(labelLabel, valueLabel, emojiLabel, roleLabel);
    await interaction.showModal(modal);
}
export async function handleAddOptionModal(interaction) {
    if (!interaction.customId.startsWith("configure_admin_add_option_modal:")) {
        return;
    }
    if (!interaction.inCachedGuild()) {
        return;
    }
    const categoryId = Number(interaction.customId.split(":")[1]);
    if (Number.isNaN(categoryId)) {
        return;
    }
    const label = interaction.fields
        .getTextInputValue("label")
        .trim();
    const value = interaction.fields
        .getTextInputValue("value")
        .trim()
        .toLowerCase()
        .replaceAll(" ", "_");
    const emoji = resolveEmojiSelection([
        ...interaction.fields.getStringSelectValues("emoji"),
    ]);
    const roles = interaction.fields.getSelectedRoles("role", true);
    const roleId = roles.first()?.id;
    if (!roleId) {
        await interaction.reply({
            content: "❌ You must select a role.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    if (await optionExists(categoryId, value)) {
        await interaction.reply({
            content: "❌ An option with that value already exists.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    createOption(categoryId, label, value, emoji, roleId);
    await refreshAdminDashboard(interaction.client, interaction.guild.id);
    await interaction.reply({
        content: `✅ Option "${label}" created successfully.`,
        flags: [
            MessageFlags.Ephemeral,
        ],
    });
}
