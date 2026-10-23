import { EmbedBuilder, } from "discord.js";
import { EMBED_COLOR, } from "../../config/constants.js";
import { getAzkabanRole, isAzkabanEnabled, } from "../../services/guildSettingsService.js";
import { imprisonUser, isPrisoner, } from "../../services/azkabanService.js";
import { isBotManager, } from "../../utils/permissions.js";
export async function sentenceCommand(interaction) {
    try {
        if (!interaction.guild) {
            await interaction.reply({
                content: "❌ This command can only be used in a server.",
                ephemeral: true,
            });
            return;
        }
        const guild = interaction.guild;
        const moderator = await guild.members.fetch(interaction.user.id);
        if (!(await isBotManager(moderator))) {
            await interaction.reply({
                content: "❌ You do not have permission to use this command.",
                ephemeral: true,
            });
            return;
        }
        if (!isAzkabanEnabled(guild.id)) {
            await interaction.reply({
                content: "❌ Azkaban is not configured for this server.",
                ephemeral: true,
            });
            return;
        }
        const azkabanRoleId = await getAzkabanRole(guild.id);
        if (!azkabanRoleId) {
            await interaction.reply({
                content: "❌ Azkaban role has not been configured.",
                ephemeral: true,
            });
            return;
        }
        const targetUser = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason", true);
        const media = interaction.options.getAttachment("media");
        if (targetUser.id ===
            interaction.user.id) {
            await interaction.reply({
                content: "❌ You cannot sentence yourself to Azkaban.",
                ephemeral: true,
            });
            return;
        }
        if (targetUser.bot) {
            await interaction.reply({
                content: "❌ You cannot sentence a bot.",
                ephemeral: true,
            });
            return;
        }
        if (await isPrisoner(guild.id, targetUser.id)) {
            await interaction.reply({
                content: "❌ This user is already imprisoned in Azkaban.",
                ephemeral: true,
            });
            return;
        }
        const member = await guild.members.fetch(targetUser.id);
        if (member.id ===
            guild.ownerId) {
            await interaction.reply({
                content: "❌ You cannot sentence the server owner.",
                ephemeral: true,
            });
            return;
        }
        const botMember = await guild.members.fetchMe();
        if (member.roles.highest.position >=
            botMember.roles.highest.position) {
            await interaction.reply({
                content: "❌ My role must be higher than the target user's highest role.",
                ephemeral: true,
            });
            return;
        }
        const savedRoles = member.roles.cache
            .filter(role => role.id !==
            guild.id)
            .map(role => role.id);
        await imprisonUser(guild.id, member.id, interaction.user.id, reason, savedRoles);
        await member.roles.set([
            azkabanRoleId,
        ]);
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setAuthor({
            name: `Sentenced by ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL(),
        })
            .setTitle("🚨 WANTED WIZARD CAPTURED")
            .setDescription(`${member} has been sentenced to Azkaban.`)
            .addFields({
            name: "Crime",
            value: reason,
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
        console.error("[DumbledoreBot] ❌ Sentence command error:", error);
        if (!interaction.replied &&
            !interaction.deferred) {
            await interaction.reply({
                content: "❌ Failed to send prisoner to Azkaban.",
                ephemeral: true,
            });
        }
    }
}
