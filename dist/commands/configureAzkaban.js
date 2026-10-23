import { Role, } from "discord.js";
import { setAzkabanEnabled, setAzkabanRole, } from "../services/guildSettingsService.js";
import { isBotManager, } from "../utils/permissions.js";
export async function configureAzkabanCommand(interaction) {
    if (!interaction.guild) {
        await interaction.reply({
            content: "❌ This command can only be used in a server.",
            ephemeral: true,
        });
        return;
    }
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!(await isBotManager(member))) {
        await interaction.reply({
            content: "❌ You do not have permission to use this command.",
            ephemeral: true,
        });
        return;
    }
    const enabled = interaction.options.getBoolean("enabled", true);
    const role = interaction.options.getRole("role");
    if (enabled &&
        !role) {
        await interaction.reply({
            content: "❌ You must select an Azkaban role when enabling Azkaban.",
            ephemeral: true,
        });
        return;
    }
    if (enabled &&
        !(role instanceof Role)) {
        await interaction.reply({
            content: "❌ Invalid role selected.",
            ephemeral: true,
        });
        return;
    }
    setAzkabanEnabled(interaction.guild.id, enabled);
    if (enabled &&
        role) {
        setAzkabanRole(interaction.guild.id, role.id);
        await interaction.reply({
            content: `⛓️ Azkaban enabled.\nPrisoner Role: ${role}`,
            ephemeral: true,
        });
        return;
    }
    await interaction.reply({
        content: "🔓 Azkaban disabled.",
        ephemeral: true,
    });
}
