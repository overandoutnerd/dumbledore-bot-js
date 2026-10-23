import { ChannelType, MessageFlags, } from "discord.js";
import { setHouseCupChannel, setHouseCupEnabled, setHouseCupLogChannel, } from "../services/guildSettingsService.js";
import { isBotManager, } from "../utils/permissions.js";
export async function configureHouseCupCommand(interaction) {
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
    const logsChannel = interaction.options.getChannel("logs_channel");
    for (const option of [
        channel,
        logsChannel,
    ]) {
        if (option &&
            option.type !==
                ChannelType.GuildText) {
            await interaction.reply({
                content: "❌ Channels must be text channels.",
                flags: [
                    MessageFlags.Ephemeral,
                ],
            });
            return;
        }
    }
    await setHouseCupEnabled(interaction.guild.id, enabled);
    if (channel) {
        await setHouseCupChannel(interaction.guild.id, channel.id);
    }
    if (logsChannel) {
        await setHouseCupLogChannel(interaction.guild.id, logsChannel.id);
    }
    const lines = [
        `🏆 House Cup ${enabled ? "enabled" : "disabled"}.`,
    ];
    if (channel) {
        lines.push(`Board channel: ${channel}`);
    }
    if (logsChannel) {
        lines.push(`Log channel: ${logsChannel}`);
    }
    if (enabled &&
        !channel) {
        lines.push("No board channel is set yet - run `/configure-house-cup` again with one, then `/house-cup` to post the board.");
    }
    await interaction.reply({
        content: lines.join("\n"),
        flags: [
            MessageFlags.Ephemeral,
        ],
    });
}
