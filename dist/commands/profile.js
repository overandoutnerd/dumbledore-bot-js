import { EmbedBuilder, MessageFlags, } from "discord.js";
import { EMBED_COLOR, } from "../config/constants.js";
import { getOrCreateUser, getUserRank, } from "../services/userService.js";
import { getUserHouseXp, } from "../services/houseXpService.js";
import { getHouseEmoji, } from "../services/houseConfigService.js";
import { getHouseDisplayName, getMemberHouse, } from "../utils/house.js";
export async function executeProfile(interaction) {
    const user = await getOrCreateUser(interaction.guild.id, interaction.user.id);
    const rank = await getUserRank(interaction.guild.id, interaction.user.id);
    const member = interaction.inCachedGuild()
        ? interaction.member
        : null;
    const house = member
        ? await getMemberHouse(member)
        : null;
    const houseXp = await getUserHouseXp(interaction.guild.id, interaction.user.id);
    const houseField = house
        ? `${await getHouseEmoji(interaction.guild.id, house)} ${getHouseDisplayName(house)} (${houseXp[house]} XP banked)`
        : "Not sorted into a house";
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(`${interaction.user.username}'s Profile`)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields({
        name: "⭐ XP",
        value: user.xp.toString(),
        inline: true,
    }, {
        name: "📈 Rank",
        value: `#${rank}`,
        inline: true,
    }, {
        name: "💬 Messages",
        value: user.messages.toString(),
        inline: true,
    }, {
        name: "🏠 House",
        value: houseField,
        inline: false,
    });
    await interaction.reply({
        embeds: [
            embed,
        ],
        flags: [
            MessageFlags.Ephemeral,
        ],
    });
}
