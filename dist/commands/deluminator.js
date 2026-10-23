import { EmbedBuilder, } from "discord.js";
import { EMBED_COLOR, } from "../config/constants.js";
import { getModChannelIds, } from "../services/guildSettingsService.js";
import { DELUMINATOR_MESSAGES, } from "../data/deluminatorMessages.js";
import { findLatestMessage, } from "../services/deluminatorService.js";
export async function executeDeluminator(interaction) {
    if (!interaction.guild) {
        await interaction.reply({
            content: "❌ This command can only be used in a server.",
            ephemeral: true,
        });
        return;
    }
    const target = interaction.options.getMember("user");
    if (!target) {
        await interaction.reply({
            content: "❌ User not found.",
            ephemeral: true,
        });
        return;
    }
    await interaction.deferReply();
    const modChannelIds = await getModChannelIds(interaction.guild.id);
    const canSeeModChannels = modChannelIds.includes(interaction.channelId);
    const result = await findLatestMessage(interaction.guild, target.id, canSeeModChannels, modChannelIds);
    if (!result) {
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle("🕯️ The Deluminator")
            .setDescription([
            "The Deluminator searches the castle...",
            "",
            `No trace of ${target} could be found.`,
        ].join("\n"));
        await interaction.editReply({
            embeds: [
                embed,
            ],
        });
        return;
    }
    const intro = DELUMINATOR_MESSAGES[Math.floor(Math.random() *
        DELUMINATOR_MESSAGES.length)];
    const title = "Wizard";
    let preview = result.message.content.trim();
    if (preview.length === 0) {
        preview =
            "[No text content]";
    }
    let mediaUrl = null;
    const attachment = result.message.attachments.first();
    if (attachment) {
        if (attachment.contentType?.startsWith("image/")) {
            mediaUrl =
                attachment.url;
            preview =
                "📷 Sent an image";
        }
        else if (attachment.contentType?.startsWith("video/")) {
            preview =
                "🎥 Sent a video";
        }
    }
    const mediaEmbed = result.message.embeds.find((embed) => embed.image?.url ||
        embed.thumbnail?.url ||
        embed.video?.url);
    if (mediaEmbed) {
        mediaUrl =
            mediaEmbed.image?.url ??
                mediaEmbed.thumbnail?.url ??
                mediaUrl;
        preview =
            "🎞️ Shared media";
    }
    const description = [
        intro,
        "",
        `**${title}**`,
        `${target}`,
        "",
        "**Location**",
        `${result.channel}`,
        "",
        "**Last Trace**",
        `> ${preview}`,
        "",
        "**Time**",
        `<t:${Math.floor(result.message.createdTimestamp /
            1000)}:R>`,
        "",
        `**[Jump to Message](${result.message.url})**`,
    ];
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("🕯️ The Deluminator")
        .setDescription(description.join("\n"));
    if (mediaUrl) {
        embed.setImage(mediaUrl);
    }
    await interaction.editReply({
        embeds: [
            embed,
        ],
    });
}
