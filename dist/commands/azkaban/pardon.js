import { EmbedBuilder, } from "discord.js";
import { EMBED_COLOR, } from "../../config/constants.js";
import { getSavedRoles, getPrisoner, pardonUser, } from "../../services/azkabanService.js";
import { isBotManager, } from "../../utils/permissions.js";
export async function pardonCommand(interaction) {
    try {
        if (!interaction.guild) {
            await interaction.reply({
                content: "❌ This command can only be used in a server.",
                ephemeral: true,
            });
            return;
        }
        const moderator = await interaction.guild.members.fetch(interaction.user.id);
        if (!(await isBotManager(moderator))) {
            await interaction.reply({
                content: "❌ You do not have permission to use this command.",
                ephemeral: true,
            });
            return;
        }
        const targetUser = interaction.options.getUser("user", true);
        const media = interaction.options.getAttachment("media");
        const prisoner = await getPrisoner(interaction.guild.id, targetUser.id);
        if (!prisoner) {
            await interaction.reply({
                content: "❌ This user is not imprisoned in Azkaban.",
                ephemeral: true,
            });
            return;
        }
        const member = await interaction.guild.members.fetch(targetUser.id);
        const savedRoles = await getSavedRoles(interaction.guild.id, targetUser.id);
        const guild = interaction.guild;
        const validRoles = savedRoles.filter(roleId => guild.roles.cache.has(roleId));
        await member.roles.set(validRoles);
        await pardonUser(interaction.guild.id, targetUser.id);
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setAuthor({
            name: `Pardoned by ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL(),
        })
            .setTitle("📜 SENTENCE SERVED")
            .setDescription(`${member} has been released from Azkaban.`)
            .addFields({
            name: "Original Crime",
            value: prisoner.reason,
        })
            .setTimestamp();
        if (media?.contentType?.startsWith("image/")) {
            embed.setImage(media.url);
        }
        await interaction.reply({
            embeds: [
                embed,
            ],
        });
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ Pardon command error:", error);
        if (!interaction.replied &&
            !interaction.deferred) {
            await interaction.reply({
                content: "❌ Failed to release prisoner from Azkaban.",
                ephemeral: true,
            });
        }
    }
}
