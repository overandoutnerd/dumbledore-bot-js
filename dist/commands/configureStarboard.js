import { ChannelType, } from "discord.js";
import { setStarboardChannel, setStarboardEnabled, setStarboardThreshold, } from "../services/guildSettingsService.js";
import { isBotManager, } from "../utils/permissions.js";
export async function configureStarboardCommand(interaction) {
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
    const threshold = interaction.options.getInteger("threshold");
    if (threshold !== null &&
        threshold < 1) {
        await interaction.reply({
            content: "❌ The star threshold must be at least 1.",
            ephemeral: true,
        });
        return;
    }
    if (enabled &&
        !channel) {
        await interaction.reply({
            content: "❌ You must select a starboard channel when enabling the starboard.",
            ephemeral: true,
        });
        return;
    }
    if (enabled &&
        channel?.type !==
            ChannelType.GuildText) {
        await interaction.reply({
            content: "❌ The starboard channel must be a text channel.",
            ephemeral: true,
        });
        return;
    }
    await setStarboardEnabled(interaction.guild.id, enabled);
    if (threshold !== null) {
        await setStarboardThreshold(interaction.guild.id, threshold);
    }
    if (enabled &&
        channel) {
        await setStarboardChannel(interaction.guild.id, channel.id);
        await interaction.reply({
            content: `⭐ Starboard enabled.\nChannel: ${channel}` +
                (threshold !== null
                    ? `\nThreshold: ${threshold} ⭐`
                    : ""),
            ephemeral: true,
        });
        return;
    }
    await interaction.reply({
        content: "⭐ Starboard disabled." +
            (threshold !== null
                ? `\nThreshold: ${threshold} ⭐`
                : ""),
        ephemeral: true,
    });
}
