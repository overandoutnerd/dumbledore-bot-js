import { LabelBuilder, MessageFlags, ModalBuilder, RoleSelectMenuBuilder, TextInputBuilder, TextInputStyle, } from "discord.js";
import { getOptionById, optionExists, updateOption, } from "../../services/optionService.js";
import { refreshAdminDashboard, } from "../../utils/refreshDashboard.js";
import { buildEmojiSelectMenu, resolveEmojiSelection, } from "../../utils/emojiPicker.js";
export async function handleEditOptionButton(interaction) {
    if (!interaction.customId.startsWith("configure_admin_edit_option:")) {
        return;
    }
    if (!interaction.inCachedGuild()) {
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
    const modal = new ModalBuilder()
        .setCustomId(`configure_admin_edit_option_modal:${optionId}`)
        .setTitle("Edit Option");
    const labelInput = new TextInputBuilder()
        .setCustomId("label")
        .setStyle(TextInputStyle.Short)
        .setValue(option.label);
    const labelLabel = new LabelBuilder()
        .setLabel("Option Label")
        .setTextInputComponent(labelInput);
    const valueInput = new TextInputBuilder()
        .setCustomId("value")
        .setStyle(TextInputStyle.Short)
        .setValue(option.value);
    const valueLabel = new LabelBuilder()
        .setLabel("Option Value")
        .setTextInputComponent(valueInput);
    const emojiSelect = await buildEmojiSelectMenu(interaction.guild, "emoji", option.emoji);
    const emojiLabel = new LabelBuilder()
        .setLabel("Emoji (optional)")
        .setDescription("Pick from this server's custom emojis")
        .setStringSelectMenuComponent(emojiSelect);
    const roleSelect = new RoleSelectMenuBuilder()
        .setCustomId("role")
        .setPlaceholder("Select the role this option grants...")
        .setRequired(true)
        .setMinValues(1)
        .setMaxValues(1)
        .setDefaultRoles([
        option.roleId,
    ]);
    const roleLabel = new LabelBuilder()
        .setLabel("Role")
        .setDescription("The role this option grants when selected")
        .setRoleSelectMenuComponent(roleSelect);
    modal.addLabelComponents(labelLabel, valueLabel, emojiLabel, roleLabel);
    await interaction.showModal(modal);
}
export async function handleEditOptionModal(interaction) {
    if (!interaction.customId.startsWith("configure_admin_edit_option_modal:")) {
        return;
    }
    if (!interaction.inCachedGuild()) {
        return;
    }
    const optionId = Number(interaction.customId.split(":")[1]);
    if (Number.isNaN(optionId)) {
        return;
    }
    const existingOption = await getOptionById(optionId);
    if (!existingOption) {
        await interaction.reply({
            content: "❌ This option no longer exists.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
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
    const roleId = roles.first()?.id ??
        existingOption.roleId;
    if (value !==
        existingOption.value &&
        await optionExists(existingOption.categoryId, value)) {
        await interaction.reply({
            content: "❌ An option with that value already exists.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    updateOption(optionId, label, value, emoji, roleId);
    await refreshAdminDashboard(interaction.client, interaction.guild.id);
    await interaction.reply({
        content: `✅ Option "${label}" updated successfully.`,
        flags: [
            MessageFlags.Ephemeral,
        ],
    });
}
