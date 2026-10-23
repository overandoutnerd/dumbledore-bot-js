import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, } from "discord.js";
import { EMBED_COLOR, } from "../config/constants.js";
import { getCategoryById, } from "../services/categoryService.js";
import { getOptionById, getOptions, } from "../services/optionService.js";
import { parseEmoji, } from "./emoji.js";
export async function buildCategoryDashboard(categoryId, selectedOptionId) {
    const category = await getCategoryById(categoryId);
    if (!category) {
        throw new Error(`Category ${categoryId} not found`);
    }
    const options = await getOptions(categoryId);
    const selectedOption = selectedOptionId
        ? await getOptionById(selectedOptionId)
        : null;
    const optionLines = options.length > 0
        ? options.map((option) => `${option.emoji ?? "•"} ${option.label}`)
        : [
            "No options created yet.",
        ];
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(`${category.emoji ?? "📁"} ${category.title}`)
        .setDescription([
        category.description,
        "",
        "**Options**",
        "",
        ...optionLines,
        "",
        `Total Options: ${options.length}`,
    ].join("\n"));
    const optionSelect = new StringSelectMenuBuilder()
        .setCustomId("configure_admin_option_select");
    if (options.length > 0) {
        optionSelect
            .setPlaceholder(selectedOption
            ? `Selected: ${selectedOption.label}`
            : "Select an option...")
            .addOptions(options.map((option) => ({
            label: option.label,
            value: option.id.toString(),
            emoji: parseEmoji(option.emoji),
            default: option.id ===
                selectedOptionId,
        })));
    }
    else {
        optionSelect
            .setPlaceholder("No options available")
            .addOptions({
            label: "No options available",
            value: "no_options",
        })
            .setDisabled(true);
    }
    const optionButtonRow = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
        .setCustomId(`configure_admin_add_option:${categoryId}`)
        .setLabel("➕ Add Option")
        .setStyle(ButtonStyle.Success), new ButtonBuilder()
        .setCustomId(selectedOptionId
        ? `configure_admin_edit_option:${selectedOptionId}`
        : "configure_admin_edit_option")
        .setLabel("✏️ Edit Option")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!selectedOptionId), new ButtonBuilder()
        .setCustomId(selectedOptionId
        ? `configure_admin_delete_option:${selectedOptionId}`
        : "configure_admin_delete_option")
        .setLabel("🗑️ Delete Option")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!selectedOptionId));
    const backRow = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
        .setCustomId("configure_admin_back_to_categories")
        .setLabel("← Back")
        .setStyle(ButtonStyle.Secondary));
    return {
        embeds: [
            embed,
        ],
        components: [
            new ActionRowBuilder()
                .addComponents(optionSelect),
            optionButtonRow,
            backRow,
        ],
    };
}
