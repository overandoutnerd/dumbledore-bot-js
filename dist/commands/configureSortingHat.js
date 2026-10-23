import { ChannelType, } from "discord.js";
import { setSortingHatChannel, setSortingHatEnabled, } from "../services/guildSettingsService.js";
import { isBotManager, } from "../utils/permissions.js";
export async function configureSortingHatCommand(interaction) {
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
            content: "❌ You must select a Sorting Hat channel when enabling the Sorting Hat.",
            ephemeral: true,
        });
        return;
    }
    if (enabled &&
        channel?.type !==
            ChannelType.GuildText) {
        await interaction.reply({
            content: "❌ The Sorting Hat channel must be a text channel.",
            ephemeral: true,
        });
        return;
    }
    setSortingHatEnabled(interaction.guild.id, enabled);
    if (enabled &&
        channel) {
        setSortingHatChannel(interaction.guild.id, channel.id);
        await interaction.reply({
            content: `🎩 Sorting Hat enabled.\nChannel: ${channel}`,
            ephemeral: true,
        });
        return;
    }
    await interaction.reply({
        content: "🎩 Sorting Hat disabled.",
        ephemeral: true,
    });
}
