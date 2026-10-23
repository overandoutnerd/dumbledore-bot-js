import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, } from "discord.js";
import { isBotManager, } from "../utils/permissions.js";
import { EMBED_COLOR, } from "../config/constants.js";
export async function executeAnnounce(interaction) {
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
    const message = interaction.options.getString("message");
    const title = interaction.options.getString("title", true);
    const body = interaction.options.getString("body", true);
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
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(title)
        .setDescription(body);
    if (media?.contentType?.startsWith("image/")) {
        embed.setImage(media.url);
    }
    const channel = interaction.channel;
    const sentMessage = await channel.send({
        content: message ||
            undefined,
        embeds: [
            embed,
        ],
        allowedMentions: {
            parse: [
                "everyone",
                "roles",
                "users",
            ],
        },
    });
    const dmMessage = await interaction.user.send({
        content: [
            "📢 **Announcement Controls**",
            "",
            `Channel: #${channel.name}`,
            "",
            message
                ? `Message: ${message}`
                : "No outside message.",
        ].join("\n"),
        embeds: [
            embed,
        ],
    });
    const row = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
        .setCustomId(`edit_announce:${sentMessage.id}:${channel.id}:${dmMessage.id}:${interaction.user.id}`)
        .setLabel("✏️ Edit")
        .setStyle(ButtonStyle.Primary), new ButtonBuilder()
        .setCustomId(`delete_announce:${sentMessage.id}:${channel.id}:${dmMessage.id}:${interaction.user.id}`)
        .setLabel("🗑 Delete")
        .setStyle(ButtonStyle.Danger));
    await dmMessage.edit({
        components: [
            row,
        ],
    });
    await interaction.editReply({
        content: "✅ Announcement sent. Check your DMs for controls.",
        components: [],
    });
    console.log(`[DumbledoreBot] 📢 Announcement sent by ${interaction.user.tag}`);
}
