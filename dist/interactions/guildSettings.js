import { ActionRowBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, } from "discord.js";
import { setBotManagerRoleIds, setHouseRoleId, setStarboardThreshold, setStarXpValue, setXpCooldownSeconds, setXpPerMessage, } from "../services/guildSettingsService.js";
import { buildGuildSettingsDashboard, } from "../utils/guildSettingsDashboard.js";
const HOUSE_KEYS = [
    "gryffindor",
    "ravenclaw",
    "hufflepuff",
    "slytherin",
];
async function renderView(interaction, guildId, view) {
    const dashboard = await buildGuildSettingsDashboard(guildId, view);
    if (interaction.isModalSubmit()) {
        await interaction.reply({
            ...dashboard,
            flags: [MessageFlags.Ephemeral],
        });
    }
    else {
        await interaction.update(dashboard);
    }
}
export async function handleGuildSettingsRoleSelect(interaction) {
    if (!interaction.customId.startsWith("guildsettings_role_") ||
        !interaction.inCachedGuild()) {
        return;
    }
    if (interaction.customId ===
        "guildsettings_role_botmanager") {
        // This menu allows any number of roles (including zero, which
        // clears the setting entirely), so its full current selection
        // - not just the first value - is what gets saved.
        await setBotManagerRoleIds(interaction.guild.id, interaction.values);
        await renderView(interaction, interaction.guild.id, "main");
        return;
    }
    const roleId = interaction.values[0];
    if (!roleId) {
        return;
    }
    const houseMatch = HOUSE_KEYS.find((house) => interaction.customId ===
        `guildsettings_role_house_${house}`);
    if (houseMatch) {
        await setHouseRoleId(interaction.guild.id, houseMatch, roleId);
        await renderView(interaction, interaction.guild.id, "house");
    }
}
export async function handleGuildSettingsButton(interaction) {
    if (!interaction.customId.startsWith("guildsettings_") ||
        !interaction.inCachedGuild()) {
        return;
    }
    if (interaction.customId ===
        "guildsettings_nav_house") {
        await renderView(interaction, interaction.guild.id, "house");
        return;
    }
    if (interaction.customId ===
        "guildsettings_nav_xp") {
        await renderView(interaction, interaction.guild.id, "xp");
        return;
    }
    if (interaction.customId ===
        "guildsettings_nav_starboard") {
        await renderView(interaction, interaction.guild.id, "starboard");
        return;
    }
    if (interaction.customId ===
        "guildsettings_back") {
        await renderView(interaction, interaction.guild.id, "main");
        return;
    }
    if (interaction.customId ===
        "guildsettings_xp_edit") {
        const modal = new ModalBuilder()
            .setCustomId("guildsettings_xp_modal")
            .setTitle("Edit XP & House Cup");
        const xpInput = new TextInputBuilder()
            .setCustomId("xp_per_message")
            .setLabel("XP per message")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        const cooldownInput = new TextInputBuilder()
            .setCustomId("xp_cooldown_seconds")
            .setLabel("XP cooldown (seconds)")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        const starXpInput = new TextInputBuilder()
            .setCustomId("star_xp_value")
            .setLabel("XP per ⭐ reaction")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(xpInput), new ActionRowBuilder().addComponents(cooldownInput), new ActionRowBuilder().addComponents(starXpInput));
        await interaction.showModal(modal);
        return;
    }
    if (interaction.customId ===
        "guildsettings_starboard_edit") {
        const modal = new ModalBuilder()
            .setCustomId("guildsettings_starboard_modal")
            .setTitle("Edit Starboard Threshold");
        const thresholdInput = new TextInputBuilder()
            .setCustomId("starboard_threshold")
            .setLabel("Stars required to hit the starboard")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(thresholdInput));
        await interaction.showModal(modal);
    }
}
export async function handleGuildSettingsModal(interaction) {
    if (!interaction.inCachedGuild()) {
        return;
    }
    if (interaction.customId ===
        "guildsettings_xp_modal") {
        const xpPerMessage = Number(interaction.fields.getTextInputValue("xp_per_message"));
        const xpCooldownSeconds = Number(interaction.fields.getTextInputValue("xp_cooldown_seconds"));
        const starXpValue = Number(interaction.fields.getTextInputValue("star_xp_value"));
        if (!Number.isInteger(xpPerMessage) ||
            xpPerMessage < 0 ||
            !Number.isInteger(xpCooldownSeconds) ||
            xpCooldownSeconds < 0 ||
            !Number.isInteger(starXpValue) ||
            starXpValue < 0) {
            await interaction.reply({
                content: "❌ All values must be whole numbers of 0 or greater.",
                flags: [
                    MessageFlags.Ephemeral,
                ],
            });
            return;
        }
        await setXpPerMessage(interaction.guild.id, xpPerMessage);
        await setXpCooldownSeconds(interaction.guild.id, xpCooldownSeconds);
        await setStarXpValue(interaction.guild.id, starXpValue);
        await renderView(interaction, interaction.guild.id, "xp");
        return;
    }
    if (interaction.customId ===
        "guildsettings_starboard_modal") {
        const threshold = Number(interaction.fields.getTextInputValue("starboard_threshold"));
        if (!Number.isInteger(threshold) ||
            threshold < 1) {
            await interaction.reply({
                content: "❌ The threshold must be a whole number of 1 or greater.",
                flags: [
                    MessageFlags.Ephemeral,
                ],
            });
            return;
        }
        await setStarboardThreshold(interaction.guild.id, threshold);
        await renderView(interaction, interaction.guild.id, "starboard");
    }
}
