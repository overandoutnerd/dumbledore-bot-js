import { ActionRowBuilder, EmbedBuilder, MessageFlags, StringSelectMenuBuilder, } from "discord.js";
import { EMBED_COLOR, } from "../config/constants.js";
import { getCategoryById, } from "../services/categoryService.js";
import { getOptions, getOptionById, getRoleIdsForCategory, } from "../services/optionService.js";
import { parseEmoji, } from "../utils/emoji.js";
export async function handleConfigureSelect(interaction) {
    if (interaction.customId ===
        "configure_category_select") {
        const categoryId = Number(interaction.values[0]);
        if (Number.isNaN(categoryId)) {
            return;
        }
        const category = await getCategoryById(categoryId);
        if (!category) {
            await interaction.reply({
                content: "❌ Category not found.",
                flags: [
                    MessageFlags.Ephemeral,
                ],
            });
            return;
        }
        const options = await getOptions(categoryId);
        if (options.length === 0) {
            await interaction.reply({
                content: "❌ No options available in this category.",
                flags: [
                    MessageFlags.Ephemeral,
                ],
            });
            return;
        }
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle(`${category.emoji ?? "📁"} ${category.title}`)
            .setDescription(category.description);
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("configure_option_select")
            .setPlaceholder("Select an option...")
            .addOptions(options.map((option) => ({
            label: option.label,
            value: option.id.toString(),
            emoji: parseEmoji(option.emoji),
        })));
        await interaction.update({
            embeds: [
                embed,
            ],
            components: [
                new ActionRowBuilder()
                    .addComponents(selectMenu),
            ],
        });
        return;
    }
    if (interaction.customId ===
        "configure_option_select") {
        const optionId = Number(interaction.values[0]);
        if (Number.isNaN(optionId)) {
            return;
        }
        const option = await getOptionById(optionId);
        if (!option) {
            await interaction.reply({
                content: "❌ Option not found.",
                flags: [
                    MessageFlags.Ephemeral,
                ],
            });
            return;
        }
        const member = interaction.member;
        const roleIds = await getRoleIdsForCategory(option.categoryId);
        if (roleIds.length > 0) {
            await member.roles.remove(roleIds);
        }
        await member.roles.add(option.roleId);
        await interaction.update({
            content: `✅ ${option.label} selected successfully.`,
            embeds: [],
            components: [],
        });
        return;
    }
}
export async function handleConfigureButton(interaction) {
    return;
}
