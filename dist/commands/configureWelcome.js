import { ChannelType, } from "discord.js";
import { setWelcomeChannel, setWelcomeEnabled, } from "../services/guildSettingsService.js";
import { isBotManager, } from "../utils/permissions.js";
export async function configureWelcomeCommand(interaction) {
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
    const channel = interaction.options.getChannel("channel");
    if (enabled &&
        !channel) {
        await interaction.reply({
            content: "❌ You must select a welcome channel when enabling welcome messages.",
            ephemeral: true,
        });
        return;
    }
    if (enabled &&
        channel?.type !==
            ChannelType.GuildText) {
        await interaction.reply({
            content: "❌ The welcome channel must be a text channel.",
            ephemeral: true,
        });
        return;
    }
    setWelcomeEnabled(interaction.guild.id, enabled);
    if (enabled &&
        channel) {
        setWelcomeChannel(interaction.guild.id, channel.id);
        await interaction.reply({
            content: `👋 Welcome messages enabled.\nChannel: ${channel}`,
            ephemeral: true,
        });
        return;
    }
    await interaction.reply({
        content: "👋 Welcome messages disabled.",
        ephemeral: true,
    });
}
