import { addModChannel, getModChannelIds, removeModChannel, } from "../services/guildSettingsService.js";
import { isBotManager, } from "../utils/permissions.js";
export async function configureModChannelsCommand(interaction) {
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
    const action = interaction.options.getString("action", true);
    const channel = interaction.options.getChannel("channel");
    if ((action === "add" ||
        action === "remove") &&
        !channel) {
        await interaction.reply({
            content: "❌ You must select a channel to add or remove.",
            ephemeral: true,
        });
        return;
    }
    if (action === "add" &&
        channel) {
        await addModChannel(interaction.guild.id, channel.id);
    }
    else if (action === "remove" &&
        channel) {
        await removeModChannel(interaction.guild.id, channel.id);
    }
    const modChannelIds = await getModChannelIds(interaction.guild.id);
    const list = modChannelIds.length > 0
        ? modChannelIds
            .map((id) => `<#${id}>`)
            .join("\n")
        : "*No mod channels configured.*";
    await interaction.reply({
        content: `🔒 Deluminator mod channels:\n${list}`,
        ephemeral: true,
    });
}
