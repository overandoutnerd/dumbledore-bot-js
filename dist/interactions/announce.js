import { ActionRowBuilder, EmbedBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, } from "discord.js";
import { EMBED_COLOR, } from "../config/constants.js";
export async function handleAnnounceButton(interaction) {
    if (interaction.customId.startsWith("delete_announce:")) {
        const [, messageId, channelId, dmMessageId, ownerId,] = interaction.customId.split(":");
        if (!messageId ||
            !channelId ||
            !dmMessageId ||
            !ownerId) {
            return;
        }
        if (interaction.user.id !==
            ownerId) {
            await interaction.reply({
                content: "❌ You cannot manage this announcement.",
                flags: [
                    MessageFlags.Ephemeral,
                ],
            });
            return;
        }
        const channel = await interaction.client.channels.fetch(channelId);
        if (!channel ||
            !channel.isTextBased()) {
            await interaction.reply({
                content: "❌ Channel not found.",
                flags: [
                    MessageFlags.Ephemeral,
                ],
            });
            return;
        }
        const message = await channel.messages.fetch(messageId);
        await message.delete();
        await interaction.update({
            content: "✅ Announcement deleted.",
            embeds: [],
            components: [],
        });
        return;
    }
    if (interaction.customId.startsWith("edit_announce:")) {
        const [, messageId, channelId, dmMessageId, ownerId,] = interaction.customId.split(":");
        if (!messageId ||
            !channelId ||
            !dmMessageId ||
            !ownerId) {
            return;
        }
        if (interaction.user.id !==
            ownerId) {
            await interaction.reply({
                content: "❌ You cannot manage this announcement.",
                flags: [
                    MessageFlags.Ephemeral,
                ],
            });
            return;
        }
        const channel = await interaction.client.channels.fetch(channelId);
        if (!channel ||
            !channel.isTextBased()) {
            await interaction.reply({
                content: "❌ Channel not found.",
                flags: [
                    MessageFlags.Ephemeral,
                ],
            });
            return;
        }
        const message = await channel.messages.fetch(messageId);
        const oldEmbed = message.embeds[0];
        const modal = new ModalBuilder()
            .setCustomId(`edit_announce_submit:${messageId}:${channelId}:${dmMessageId}:${ownerId}`)
            .setTitle("Edit Announcement");
        const messageInput = new TextInputBuilder()
            .setCustomId("message")
            .setLabel("Outside Message")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(message.content);
        const titleInput = new TextInputBuilder()
            .setCustomId("title")
            .setLabel("Title")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setValue(oldEmbed?.title ??
            "");
        const bodyInput = new TextInputBuilder()
            .setCustomId("body")
            .setLabel("Body")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setValue(oldEmbed?.description ??
            "");
        modal.addComponents(new ActionRowBuilder()
            .addComponents(messageInput), new ActionRowBuilder()
            .addComponents(titleInput), new ActionRowBuilder()
            .addComponents(bodyInput));
        await interaction.showModal(modal);
    }
}
export async function handleAnnounceModal(interaction) {
    if (!interaction.customId.startsWith("edit_announce_submit:")) {
        return;
    }
    const [, messageId, channelId, dmMessageId, ownerId,] = interaction.customId.split(":");
    if (!messageId ||
        !channelId ||
        !dmMessageId ||
        !ownerId) {
        return;
    }
    if (interaction.user.id !==
        ownerId) {
        await interaction.reply({
            content: "❌ You cannot edit this announcement.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    const channel = await interaction.client.channels.fetch(channelId);
    if (!channel ||
        !channel.isTextBased()) {
        await interaction.reply({
            content: "❌ Channel not found.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    const message = await channel.messages.fetch(messageId);
    const outsideMessage = interaction.fields.getTextInputValue("message");
    const title = interaction.fields.getTextInputValue("title");
    const body = interaction.fields.getTextInputValue("body");
    const oldEmbed = message.embeds[0];
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(title)
        .setDescription(body);
    if (oldEmbed?.image?.url) {
        embed.setImage(oldEmbed.image.url);
    }
    await message.edit({
        content: outsideMessage ||
            undefined,
        embeds: [
            embed,
        ],
    });
    const dmChannel = await interaction.user.createDM();
    const dmMessage = await dmChannel.messages.fetch(dmMessageId);
    const row = dmMessage.components[0];
    await dmMessage.edit({
        content: [
            "📢 **Announcement Controls**",
            "",
            `Channel: #${channel.name}`,
            "",
            outsideMessage
                ? `Message: ${outsideMessage}`
                : "No outside message.",
        ].join("\n"),
        embeds: [
            embed,
        ],
        components: row
            ? [row]
            : [],
    });
    await interaction.reply({
        content: "✅ Announcement updated.",
        flags: [
            MessageFlags.Ephemeral,
        ],
    });
}
