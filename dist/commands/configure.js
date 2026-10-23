import { ActionRowBuilder, EmbedBuilder, MessageFlags, StringSelectMenuBuilder, } from "discord.js";
import { EMBED_COLOR, } from "../config/constants.js";
import { getCategories, } from "../services/categoryService.js";
import { parseEmoji, } from "../utils/emoji.js";
export async function executeConfigure(interaction) {
    if (!interaction.inCachedGuild()) {
        return;
    }
    const categories = await getCategories(interaction.guild.id);
    if (categories.length === 0) {
        await interaction.reply({
            content: "❌ No configuration categories have been created yet.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("⚙️ Configure Roles")
        .setDescription("Select a category below to manage your roles.");
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("configure_category_select")
        .setPlaceholder("Select a category...")
        .addOptions(categories.map((category) => ({
        label: category.title,
        value: category.id.toString(),
        description: category.description
            .slice(0, 100),
        emoji: parseEmoji(category.emoji),
    })));
    await interaction.reply({
        embeds: [
            embed,
        ],
        components: [
            new ActionRowBuilder()
                .addComponents(selectMenu),
        ],
        flags: [
            MessageFlags.Ephemeral,
        ],
    });
}
