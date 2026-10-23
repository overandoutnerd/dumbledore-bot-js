import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, } from "discord.js";
import { SORTING_QUESTIONS, } from "../data/sortingQuestions.js";
import { createSortingLog, createSortingProfile, updateSortingProfile, getSortingProfile, getSortingHistory, } from "../services/sortingService.js";
import { startSorting, getActiveSorting, updateActiveSorting, removeActiveSorting, } from "../services/activeSortingService.js";
import { determineHouse, getHouseDescription, getHouseName, getHouseRoleId, getAllHouseRoleIds, House, } from "../utils/sorting.js";
import { getHouseEmoji as getConfiguredHouseEmoji, } from "../services/houseConfigService.js";
import { getSortingHatChannel, isSortingHatEnabled, } from "../services/guildSettingsService.js";
function createQuestionMessage(questionIndex) {
    const question = SORTING_QUESTIONS[questionIndex];
    const embed = new EmbedBuilder()
        .setTitle(`🧙 Question ${question.id}/${SORTING_QUESTIONS.length}`)
        .setDescription([
        `**${question.question}**`,
        "",
        ...question.answers.map((answer) => `**${answer.id}.** ${answer.label}`),
    ].join("\n"));
    const row = new ActionRowBuilder();
    for (const answer of question.answers) {
        row.addComponents(new ButtonBuilder()
            .setCustomId(`sorting_answer_${answer.id}`)
            .setLabel(answer.id)
            .setStyle(ButtonStyle.Primary));
    }
    return {
        embeds: [
            embed,
        ],
        components: [
            row,
        ],
    };
}
export async function handleSortMeButton(interaction) {
    if (!interaction.guild) {
        return;
    }
    if (interaction.customId ===
        "sorting_start") {
        startSorting(interaction.guild.id, interaction.user.id);
        await interaction.update(createQuestionMessage(0));
        return;
    }
    if (interaction.customId ===
        "sorting_resort") {
        const embed = new EmbedBuilder()
            .setTitle("🧙 The Sorting Hat")
            .setDescription([
            "You have requested to be re-sorted.",
            "",
            "The Sorting Hat will reconsider its decision.",
            "",
            "Your previous house will be preserved in your sorting history.",
            "",
            "Are you certain?",
        ].join("\n"));
        const row = new ActionRowBuilder()
            .addComponents(new ButtonBuilder()
            .setCustomId("sorting_resort_confirm")
            .setLabel("Begin Resorting")
            .setStyle(ButtonStyle.Primary), new ButtonBuilder()
            .setCustomId("sorting_resort_cancel")
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Secondary));
        await interaction.update({
            embeds: [
                embed,
            ],
            components: [
                row,
            ],
        });
        return;
    }
    if (interaction.customId ===
        "sorting_resort_cancel") {
        await interaction.update({
            content: "Sorting cancelled.",
            embeds: [],
            components: [],
        });
        return;
    }
    if (interaction.customId ===
        "sorting_resort_confirm") {
        startSorting(interaction.guild.id, interaction.user.id, true);
        await interaction.update(createQuestionMessage(0));
        return;
    }
    if (!interaction.customId.startsWith("sorting_answer_")) {
        return;
    }
    const sorting = getActiveSorting(interaction.guild.id, interaction.user.id);
    if (!sorting) {
        await interaction.reply({
            content: "❌ Sorting session expired.",
            ephemeral: true,
        });
        return;
    }
    const question = SORTING_QUESTIONS[sorting.questionIndex];
    const answerId = interaction.customId.replace("sorting_answer_", "");
    const answer = question.answers.find((item) => item.id ===
        answerId);
    if (!answer) {
        return;
    }
    for (const [house, points,] of Object.entries(answer.scores)) {
        switch (house) {
            case House.GRYFFINDOR:
                sorting.scores.gryffindor +=
                    points ?? 0;
                break;
            case House.RAVENCLAW:
                sorting.scores.ravenclaw +=
                    points ?? 0;
                break;
            case House.HUFFLEPUFF:
                sorting.scores.hufflepuff +=
                    points ?? 0;
                break;
            case House.SLYTHERIN:
                sorting.scores.slytherin +=
                    points ?? 0;
                break;
        }
    }
    sorting.questionIndex++;
    updateActiveSorting(sorting);
    if (sorting.questionIndex <
        SORTING_QUESTIONS.length) {
        await interaction.update(createQuestionMessage(sorting.questionIndex));
        return;
    }
    await interaction.deferUpdate();
    const house = determineHouse(sorting.scores);
    const existingProfile = await getSortingProfile(interaction.guild.id, interaction.user.id);
    const isResort = sorting.isResort;
    const history = await getSortingHistory(interaction.guild.id, interaction.user.id);
    let oldHouse = null;
    if (isResort &&
        existingProfile) {
        oldHouse =
            existingProfile.house;
        updateSortingProfile(interaction.guild.id, interaction.user.id, house);
    }
    else {
        createSortingProfile(interaction.guild.id, interaction.user.id, house);
    }
    if (!isResort) {
        createSortingLog(interaction.guild.id, interaction.user.id, null, house, interaction.user.id, "Initial Sorting");
    }
    else if (oldHouse !== house) {
        createSortingLog(interaction.guild.id, interaction.user.id, oldHouse, house, interaction.user.id, "Resort");
    }
    try {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const roleId = await getHouseRoleId(interaction.guild.id, house);
        await member.roles.remove(await getAllHouseRoleIds(interaction.guild.id));
        if (roleId) {
            await member.roles.add(roleId);
        }
        else {
            console.error(`[SortingHat] No role configured for house "${house}" in guild ${interaction.guild.id}.`);
        }
        const sortingHatEnabled = await isSortingHatEnabled(interaction.guild.id);
        const sortingHatChannelId = sortingHatEnabled
            ? await getSortingHatChannel(interaction.guild.id)
            : null;
        const channel = sortingHatChannelId
            ? await interaction.guild.channels.fetch(sortingHatChannelId)
            : null;
        if (channel &&
            channel.isTextBased()) {
            let footerText = "";
            if (isResort &&
                oldHouse) {
                const isSameHouse = oldHouse === house;
                const originalHouse = history.length > 0
                    ? history[history.length - 1].newHouse
                    : oldHouse;
                const returnedToOriginalHouse = house === originalHouse;
                if (isSameHouse) {
                    footerText =
                        "*The Hat remains certain of its original decision.*";
                }
                else if (returnedToOriginalHouse) {
                    footerText =
                        `*Welcome back to ${getHouseName(house)}. Perhaps the Hat's first judgement was the correct one.*`;
                }
                else {
                    footerText =
                        `*Formerly ${getHouseName(oldHouse)}*`;
                }
            }
            const houseEmoji = await getConfiguredHouseEmoji(interaction.guild.id, house);
            const announcementEmbed = new EmbedBuilder()
                .setTitle("🧙 The Sorting Hat")
                .setDescription(isResort
                ? [
                    "The Sorting Hat has reconsidered its judgement.",
                    "",
                    `${interaction.user}`,
                    "has been placed in",
                    "",
                    `# ${houseEmoji} ${getHouseName(house)}`,
                    "",
                    footerText,
                ].join("\n")
                : [
                    "A new student has been sorted.",
                    "",
                    `${interaction.user}`,
                    "has joined",
                    "",
                    `# ${houseEmoji} ${getHouseName(house)}`,
                    "",
                    "*Welcome to your new house.*",
                ].join("\n"));
            await channel.send({
                embeds: [
                    announcementEmbed,
                ],
            });
        }
    }
    catch (error) {
        console.error("[SortingHat] Failed to assign role:", error);
    }
    removeActiveSorting(interaction.guild.id, interaction.user.id);
    const resultEmoji = await getConfiguredHouseEmoji(interaction.guild.id, house);
    const [gryffindorEmoji, ravenclawEmoji, hufflepuffEmoji, slytherinEmoji,] = await Promise.all([
        "gryffindor",
        "ravenclaw",
        "hufflepuff",
        "slytherin",
    ].map((h) => getConfiguredHouseEmoji(interaction.guild.id, h)));
    const embed = new EmbedBuilder()
        .setTitle(`${resultEmoji} ${getHouseName(house)}`)
        .setDescription(getHouseDescription(house))
        .addFields({
        name: "Scores",
        value: [
            `${gryffindorEmoji} Gryffindor: ${sorting.scores.gryffindor}`,
            `${ravenclawEmoji} Ravenclaw: ${sorting.scores.ravenclaw}`,
            `${hufflepuffEmoji} Hufflepuff: ${sorting.scores.hufflepuff}`,
            `${slytherinEmoji} Slytherin: ${sorting.scores.slytherin}`,
        ].join("\n"),
    });
    await interaction.editReply({
        embeds: [
            embed,
        ],
        components: [],
    });
}
