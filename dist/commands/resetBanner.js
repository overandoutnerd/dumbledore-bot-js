import { Routes, } from "discord.js";
import { isBotManager, } from "../utils/permissions.js";
export async function resetBannerCommand(interaction) {
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
        await interaction.deferReply({
            ephemeral: true,
        });
        await interaction.client.rest.patch(Routes.guildMember(interaction.guild.id, "@me"), {
            body: {
                banner: null,
            },
        });
        await interaction.editReply("✅ Guild banner reset successfully.");
    }
    catch (error) {
        let errorMessage = "❌ Failed to reset the guild banner.";
        if (error &&
            typeof error === "object" &&
            "rawError" in error) {
            const rawError = error.rawError;
            const avatarError = rawError?.errors?.avatar?._errors?.[0]
                ?.message;
            errorMessage =
                avatarError ??
                    rawError?.message ??
                    errorMessage;
        }
        if (interaction.deferred) {
            await interaction.editReply(`❌ ${errorMessage}`);
        }
        else if (!interaction.replied) {
            await interaction.reply({
                content: `❌ ${errorMessage}`,
                ephemeral: true,
            });
        }
    }
}
