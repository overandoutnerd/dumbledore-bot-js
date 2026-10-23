import { EmbedBuilder, } from "discord.js";
import { EMBED_COLOR, } from "../config/constants.js";
import { ELDER_WAND_MESSAGES, } from "../data/elderWandMessages.js";
import { getOldestMembers, } from "../services/memberHistoryService.js";
export async function executeElderWand(interaction) {
    if (!interaction.guild) {
        await interaction.reply({
            content: "❌ This command can only be used in a server.",
            ephemeral: true,
        });
        return;
    }
    await interaction.deferReply();
    const oldestMembers = await getOldestMembers(interaction.guild.id, 5);
    console.log(oldestMembers);
    if (oldestMembers.length === 0) {
        await interaction.editReply({
            content: "❌ No members found.",
        });
        return;
    }
    const intro = ELDER_WAND_MESSAGES[Math.floor(Math.random() *
        ELDER_WAND_MESSAGES.length)];
    const medals = [
        "🥇",
        "🥈",
        "🥉",
        "4️⃣",
        "5️⃣",
    ];
    const lines = [];
    for (let index = 0; index < oldestMembers.length; index++) {
        const memberData = oldestMembers[index];
        let mention = `<@${memberData.userId}>`;
        try {
            const member = await interaction.guild.members.fetch(memberData.userId);
            mention =
                member.toString();
        }
        catch {
            // Member left server.
        }
        lines.push([
            `${medals[index]} ${mention}`,
            `Joined <t:${Math.floor(memberData.joinedAt /
                1000)}:R>`,
        ].join("\n"));
    }
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("🪄 The Elder Wand")
        .setDescription([
        intro,
        "",
        lines.join("\n\n"),
    ].join("\n"))
        .setFooter({
        text: "The five oldest members of the castle",
    });
    await interaction.editReply({
        embeds: [
            embed,
        ],
    });
}
