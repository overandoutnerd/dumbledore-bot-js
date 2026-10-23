import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, } from "discord.js";
import { EMBED_COLOR, } from "../config/constants.js";
import { getCategories, } from "../services/categoryService.js";
import { parseEmoji, } from "./emoji.js";
export async function buildAdminDashboard(guildId, selectedCategoryId) {
    const categories = await getCategories(guildId);
    const selectedCategory = categories.find((category) => category.id ===
        selectedCategoryId);
    const categoryLines = categories.length > 0
        ? categories.map((category) => `${category.emoji ?? "📁"} ${category.title}`)
        : [
            "No categories created yet.",
        ];
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("⚙️ Configuration Dashboard")
        .setDescription([
        "**Categories**",
        "",
        ...categoryLines,
        "",
        `**Total Categories:** ${categories.length}`,
    ].join("\n"));
    const categorySelectMenu = new StringSelectMenuBuilder()
        .setCustomId("configure_admin_category_select");
    if (categories.length > 0) {
        categorySelectMenu
            .setPlaceholder(selectedCategory
            ? `Selected: ${selectedCategory.title}`
            : "Select a category...")
            .addOptions(categories.map((category) => ({
            label: category.title ||
                "Untitled Category",
            value: category.id.toString(),
            description: category.description
                ?.trim()
                .slice(0, 100) ||
                "No description",
            emoji: parseEmoji(category.emoji),
            default: category.id ===
                selectedCategoryId,
        })));
    }
    else {
        categorySelectMenu
            .setPlaceholder("No categories available")
            .addOptions({
            label: "No categories available",
            value: "no_categories",
            description: "Create a category first",
        })
            .setDisabled(true);
    }
    const categoryButtonRow = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
        .setCustomId("configure_admin_add_category")
        .setLabel("➕ Add Category")
        .setStyle(ButtonStyle.Success), new ButtonBuilder()
        .setCustomId(selectedCategoryId
        ? `configure_admin_edit_category:${selectedCategoryId}`
        : "configure_admin_edit_category")
        .setLabel("✏️ Edit Category")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!selectedCategoryId), new ButtonBuilder()
        .setCustomId(selectedCategoryId
        ? `configure_admin_delete_category:${selectedCategoryId}`
        : "configure_admin_delete_category")
        .setLabel("🗑️ Delete Category")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!selectedCategoryId), new ButtonBuilder()
        .setCustomId(selectedCategoryId
        ? `configure_admin_configure_category:${selectedCategoryId}`
        : "configure_admin_configure_category")
        .setLabel("⚙️ Configure")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!selectedCategoryId));
    return {
        embeds: [
            embed,
        ],
        components: [
            new ActionRowBuilder()
                .addComponents(categorySelectMenu),
            categoryButtonRow,
        ],
    };
}
