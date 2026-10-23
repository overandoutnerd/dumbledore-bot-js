import { ActionRowBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, } from "discord.js";
export async function handleSayButton(interaction) {
    if (interaction.customId.startsWith("delete_message:")) {
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
                content: "❌ You cannot manage this message.",
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
            content: "✅ Message deleted.",
            components: [],
        });
        return;
    }
    if (interaction.customId.startsWith("edit_message:")) {
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
                content: "❌ You cannot manage this message.",
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
        const modal = new ModalBuilder()
            .setCustomId(`edit_message_submit:${messageId}:${channelId}:${dmMessageId}:${ownerId}`)
            .setTitle("Edit Message");
        const input = new TextInputBuilder()
            .setCustomId("content")
            .setLabel("Message")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setValue(message.content);
        modal.addComponents(new ActionRowBuilder()
            .addComponents(input));
        await interaction.showModal(modal);
        return;
    }
}
export async function handleSayModal(interaction) {
    if (!interaction.customId.startsWith("edit_message_submit:")) {
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
            content: "❌ You cannot edit this message.",
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
    const newContent = interaction.fields.getTextInputValue("content");
    await message.edit({
        content: newContent,
    });
    const dmChannel = await interaction.user.createDM();
    const dmMessage = await dmChannel.messages.fetch(dmMessageId);
    const row = dmMessage.components[0];
    await dmMessage.edit({
        content: [
            "📢 **Message Controls**",
            "",
            `Channel: #${channel.name}`,
            "",
            "Preview:",
            newContent,
        ].join("\n"),
        components: row
            ? [row]
            : [],
    });
    await interaction.reply({
        content: "✅ Message updated.",
        flags: [
            MessageFlags.Ephemeral,
        ],
    });
}
