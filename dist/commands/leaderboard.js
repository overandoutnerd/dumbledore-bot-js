import { EmbedBuilder, } from "discord.js";
import { EMBED_COLOR, } from "../config/constants.js";
import { getLeaderboard, } from "../services/userService.js";
export async function executeLeaderboard(interaction) {
    const users = await getLeaderboard(interaction.guild.id, 10);
    const description = users.length === 0
        ? "No users found."
        : users
            .map((user, index) => `${index + 1}. <@${user.userId}> • ${user.xp} XP`)
            .join("\n");
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("🏆 Leaderboard")
        .setDescription(description);
    await interaction.reply({
        embeds: [
            embed,
        ],
    });
}
