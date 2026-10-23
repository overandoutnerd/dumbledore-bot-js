import { ChannelType, MessageFlags, } from "discord.js";
import { setLogChannel, setLogsEnabled, } from "../services/guildSettingsService.js";
import { isBotManager, } from "../utils/permissions.js";
export async function executeConfigureLogs(interaction) {
    if (!interaction.guild) {
        await interaction.reply({
            content: "❌ This command can only be used in a server.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!(await isBotManager(member))) {
        await interaction.reply({
            content: "❌ You do not have permission to use this command.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    const enabled = interaction.options.getBoolean("enabled", true);
    const channel = interaction.options.getChannel("channel");
    if (!enabled) {
        setLogsEnabled(interaction.guild.id, false);
        await interaction.reply({
            content: "✅ Logging has been disabled.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    if (!channel) {
        await interaction.reply({
            content: "❌ You must select a channel when enabling logs.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    if (channel.type !==
        ChannelType.GuildText &&
        channel.type !==
            ChannelType.GuildAnnouncement) {
        await interaction.reply({
            content: "❌ Please select a text channel.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    setLogChannel(interaction.guild.id, channel.id);
    setLogsEnabled(interaction.guild.id, true);
    await interaction.reply({
        content: `✅ Logging enabled in ${channel}.`,
        flags: [
            MessageFlags.Ephemeral,
        ],
    });
}
