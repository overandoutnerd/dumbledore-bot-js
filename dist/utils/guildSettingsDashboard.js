import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, RoleSelectMenuBuilder, } from "discord.js";
import { EMBED_COLOR, } from "../config/constants.js";
import { getGuildSettingsSummary, } from "../services/guildSettingsService.js";
function formatRole(roleId) {
    return roleId
        ? `<@&${roleId}>`
        : "Not configured";
}
export async function buildGuildSettingsDashboard(guildId, view = "main") {
    const settings = await getGuildSettingsSummary(guildId);
    if (view === "house") {
        return buildHouseView(settings);
    }
    if (view === "xp") {
        return buildXpView(settings);
    }
    if (view === "starboard") {
        return buildStarboardView(settings);
    }
    return buildMainView(settings);
}
function buildMainView(settings) {
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("🏰 Guild Settings")
        .setDescription("Configure the roles and values Dumbledore uses across this server.")
        .addFields({
        name: settings.botManagerRoleIds.length > 1
            ? "🪄 Bot Manager Roles"
            : "🪄 Bot Manager Role",
        value: settings.botManagerRoleIds.length > 0
            ? settings.botManagerRoleIds
                .map((roleId) => `<@&${roleId}>`)
                .join("\n")
            : "Not configured (falls back to Administrator permission)",
        inline: true,
    }, {
        name: "🏠 House Roles",
        value: `🦁 ${formatRole(settings.gryffindorRoleId)}\n` +
            `🦅 ${formatRole(settings.ravenclawRoleId)}\n` +
            `🦡 ${formatRole(settings.hufflepuffRoleId)}\n` +
            `🐍 ${formatRole(settings.slytherinRoleId)}`,
    }, {
        name: "✨ XP per Message",
        value: `${settings.xpPerMessage} XP`,
        inline: true,
    }, {
        name: "⏱️ XP Cooldown",
        value: `${settings.xpCooldownSeconds}s`,
        inline: true,
    }, {
        name: "🌟 XP per Star",
        value: `${settings.starXpValue} XP`,
        inline: true,
    }, {
        name: "⭐ Starboard Threshold",
        value: `${settings.starboardThreshold} ⭐`,
        inline: true,
    })
        .setFooter({
        text: "Use the menus below to update a role. Use the buttons for house roles, XP or the starboard threshold.",
    });
    const botManagerRoleSelect = new RoleSelectMenuBuilder()
        .setCustomId("guildsettings_role_botmanager")
        .setPlaceholder("Select the Bot Manager role(s)...")
        .setMinValues(0)
        .setMaxValues(10);
    if (settings.botManagerRoleIds.length > 0) {
        botManagerRoleSelect.setDefaultRoles(settings.botManagerRoleIds);
    }
    const botManagerRow = new ActionRowBuilder()
        .addComponents(botManagerRoleSelect);
    const navRow = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
        .setCustomId("guildsettings_nav_house")
        .setLabel("🏠 House Roles")
        .setStyle(ButtonStyle.Secondary), new ButtonBuilder()
        .setCustomId("guildsettings_nav_xp")
        .setLabel("✨ XP & Points")
        .setStyle(ButtonStyle.Secondary), new ButtonBuilder()
        .setCustomId("guildsettings_nav_starboard")
        .setLabel("⭐ Starboard Threshold")
        .setStyle(ButtonStyle.Secondary));
    return {
        embeds: [
            embed,
        ],
        components: [
            botManagerRow,
            navRow,
        ],
    };
}
function buildHouseView(settings) {
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("🏠 House Roles")
        .setDescription("Select the role Dumbledore should assign for each house.")
        .addFields({
        name: "🦁 Gryffindor",
        value: formatRole(settings.gryffindorRoleId),
        inline: true,
    }, {
        name: "🦅 Ravenclaw",
        value: formatRole(settings.ravenclawRoleId),
        inline: true,
    }, {
        name: "🦡 Hufflepuff",
        value: formatRole(settings.hufflepuffRoleId),
        inline: true,
    }, {
        name: "🐍 Slytherin",
        value: formatRole(settings.slytherinRoleId),
        inline: true,
    });
    const rows = [
        [
            "gryffindor",
            "🦁 Select the Gryffindor role...",
        ],
        [
            "ravenclaw",
            "🦅 Select the Ravenclaw role...",
        ],
        [
            "hufflepuff",
            "🦡 Select the Hufflepuff role...",
        ],
        [
            "slytherin",
            "🐍 Select the Slytherin role...",
        ],
    ].map(([house, placeholder,]) => new ActionRowBuilder()
        .addComponents(new RoleSelectMenuBuilder()
        .setCustomId(`guildsettings_role_house_${house}`)
        .setPlaceholder(placeholder)
        .setMinValues(1)
        .setMaxValues(1)));
    const backRow = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
        .setCustomId("guildsettings_back")
        .setLabel("◀ Back")
        .setStyle(ButtonStyle.Secondary));
    return {
        embeds: [
            embed,
        ],
        components: [
            ...rows,
            backRow,
        ],
    };
}
function buildXpView(settings) {
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("✨ XP & House Cup")
        .setDescription("These values control how members earn XP, which feeds directly into their house's House Cup average.")
        .addFields({
        name: "XP per Message",
        value: `${settings.xpPerMessage} XP`,
        inline: true,
    }, {
        name: "XP Cooldown",
        value: `${settings.xpCooldownSeconds}s`,
        inline: true,
    }, {
        name: "XP per Star Reaction",
        value: `${settings.starXpValue} XP`,
        inline: true,
    });
    const editRow = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
        .setCustomId("guildsettings_xp_edit")
        .setLabel("✏️ Edit Values")
        .setStyle(ButtonStyle.Primary));
    const backRow = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
        .setCustomId("guildsettings_back")
        .setLabel("◀ Back")
        .setStyle(ButtonStyle.Secondary));
    return {
        embeds: [
            embed,
        ],
        components: [
            editRow,
            backRow,
        ],
    };
}
function buildStarboardView(settings) {
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("⭐ Starboard Threshold")
        .setDescription("Number of ⭐ reactions a message needs before it's posted to the starboard.")
        .addFields({
        name: "Current Threshold",
        value: `${settings.starboardThreshold} ⭐`,
    });
    const editRow = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
        .setCustomId("guildsettings_starboard_edit")
        .setLabel("✏️ Edit Threshold")
        .setStyle(ButtonStyle.Primary));
    const backRow = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
        .setCustomId("guildsettings_back")
        .setLabel("◀ Back")
        .setStyle(ButtonStyle.Secondary));
    return {
        embeds: [
            embed,
        ],
        components: [
            editRow,
            backRow,
        ],
    };
}
