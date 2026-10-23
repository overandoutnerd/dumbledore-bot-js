import { DiscordAPIError, Routes, } from "discord.js";
import { isBotManager, } from "../utils/permissions.js";
export async function setBannerCommand(interaction) {
    try {
        if (!interaction.guild) {
            await interaction.reply({
                content: "❌ This command can only be used in a server.",
                ephemeral: true,
            });
            return;
        }
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const hasPermission = await isBotManager(member);
        if (!hasPermission) {
            await interaction.reply({
                content: "❌ You do not have permission to use this command.",
                ephemeral: true,
            });
            return;
        }
        const image = interaction.options.getAttachment("image", true);
        if (!image.contentType?.startsWith("image/")) {
            await interaction.reply({
                content: "❌ Please upload a valid image.",
                ephemeral: true,
            });
            return;
        }
        await interaction.deferReply({
            ephemeral: true,
        });
        const response = await fetch(image.url);
        if (!response.ok) {
            await interaction.editReply("❌ Failed to download the image.");
            return;
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        const banner = `data:${image.contentType};base64,${buffer.toString("base64")}`;
        await interaction.client.rest.patch(Routes.guildMember(interaction.guild.id, "@me"), {
            body: {
                banner,
            },
        });
        await interaction.editReply("✅ Guild banner updated successfully.");
    }
    catch (error) {
        let message = "❌ Failed to update the guild banner.";
        if (error instanceof
            DiscordAPIError) {
            const apiError = error.rawError;
            const bannerError = apiError
                .errors
                ?.banner
                ?._errors?.[0]
                ?.message;
            if (bannerError) {
                message =
                    `❌ ${bannerError}`;
            }
            else {
                message =
                    `❌ ${error.message}`;
            }
        }
        if (interaction.deferred) {
            await interaction.editReply(message);
        }
        else if (!interaction.replied) {
            await interaction.reply({
                content: message,
                ephemeral: true,
            });
        }
    }
}
