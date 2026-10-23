import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, } from "discord.js";
import { isBotManager, } from "../utils/permissions.js";
export async function executeSay(interaction) {
    const member = interaction.member;
    if (!(await isBotManager(member))) {
        await interaction.reply({
            content: "❌ You do not have permission to use this command.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    const message = interaction.options.getString("message", true);
    const media = interaction.options.getAttachment("media");
    if (!interaction.channel) {
        await interaction.reply({
            content: "❌ Unable to find channel.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    await interaction.deferReply({
        flags: [
            MessageFlags.Ephemeral,
        ],
    });
    const channel = interaction.channel;
    const sentMessage = await channel.send({
        content: message,
        files: media
            ? [media.url]
            : [],
    });
    const dmMessage = await interaction.user.send({
        content: [
            "📢 **Message Controls**",
            "",
            `Channel: #${channel.name}`,
            "",
            "Preview:",
            message,
        ].join("\n"),
    });
    const row = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
        .setCustomId(`edit_message:${sentMessage.id}:${channel.id}:${dmMessage.id}:${interaction.user.id}`)
        .setLabel("✏️ Edit")
        .setStyle(ButtonStyle.Primary), new ButtonBuilder()
        .setCustomId(`delete_message:${sentMessage.id}:${channel.id}:${dmMessage.id}:${interaction.user.id}`)
        .setLabel("🗑 Delete")
        .setStyle(ButtonStyle.Danger));
    await dmMessage.edit({
        components: [
            row,
        ],
    });
    await interaction.editReply({
        content: "✅ Message sent. Check your DMs for controls.",
        components: [],
    });
    console.log(`[DumbledoreBot] 📢 Message sent by ${interaction.user.tag}`);
}
