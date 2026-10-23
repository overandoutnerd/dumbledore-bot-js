import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, } from "discord.js";
import { EMBED_COLOR, } from "../config/constants.js";
import { getSortingProfile, getSortedStudentCount, getHouseMemberCount, } from "../services/sortingService.js";
import { getHouseName, } from "../utils/sorting.js";
import { getHouseEmoji as getConfiguredHouseEmoji, } from "../services/houseConfigService.js";
export async function executeSortMe(interaction) {
    if (!interaction.guild ||
        !interaction.member) {
        await interaction.reply({
            content: "❌ This command can only be used in a server.",
            ephemeral: true,
        });
        return;
    }
    const profile = await getSortingProfile(interaction.guild.id, interaction.user.id);
    if (profile) {
        const house = profile.house;
        const houseMemberCount = getHouseMemberCount(interaction.guild.id, profile.house);
        const totalSorted = getSortedStudentCount(interaction.guild.id);
        const houseEmoji = await getConfiguredHouseEmoji(interaction.guild.id, house);
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle("🧙 The Sorting Hat")
            .setDescription([
            "You have already been sorted.",
            "",
            "**House**",
            `${houseEmoji} ${getHouseName(house)}`,
            "",
            "**House Members**",
            houseMemberCount.toString(),
            "",
            "**Total Sorted Students**",
            totalSorted.toString(),
            "",
            "**Sorted**",
            `<t:${Math.floor(profile.sortedAt /
                1000)}:F>`,
            "",
            "*The Sorting Hat's decision is final.*",
        ].join("\n"));
        const row = new ActionRowBuilder()
            .addComponents(new ButtonBuilder()
            .setCustomId("sorting_resort")
            .setLabel("Resort Me")
            .setStyle(ButtonStyle.Secondary));
        await interaction.reply({
            embeds: [
                embed,
            ],
            components: [
                row,
            ],
            ephemeral: true,
        });
        return;
    }
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("🧙 The Sorting Hat")
        .setDescription([
        "Ah, another student.",
        "",
        "Let us see where you belong.",
        "",
        "The Sorting Hat will ask a series of questions before deciding your house.",
    ].join("\n"));
    const row = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
        .setCustomId("sorting_start")
        .setLabel("Begin Sorting")
        .setStyle(ButtonStyle.Primary));
    await interaction.reply({
        embeds: [
            embed,
        ],
        components: [
            row,
        ],
        ephemeral: true,
    });
}
