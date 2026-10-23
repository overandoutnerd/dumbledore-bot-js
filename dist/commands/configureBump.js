import { setBumpEnabled, } from "../services/guildSettingsService.js";
import { isBotManager, } from "../utils/permissions.js";
export async function configureBumpCommand(interaction) {
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
    await setBumpEnabled(interaction.guild.id, enabled);
    await interaction.reply({
        content: enabled
            ? "🙏 Thank System enabled. Bumps will get a thank-you message and a reminder once the cooldown ends."
            : "🙏 Thank System disabled. Bumps will no longer get a thank-you message or reminder.",
        ephemeral: true,
    });
}
