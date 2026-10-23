import { EmbedBuilder, } from "discord.js";
import { EMBED_COLOR, } from "../config/constants.js";
import { getWelcomeChannel, isWelcomeEnabled, } from "../services/guildSettingsService.js";
import { welcomeMessages, } from "../data/welcomeMessages.js";
import { saveMember, } from "../services/memberHistoryService.js";
import { incrementJoin, } from "../services/analyticsTracker.js";
import { getRandomWelcomeMessage, } from "../services/welcomeMessagesService.js";
import { resolveWelcomeMacros, } from "../utils/welcomeMacros.js";
import { buildCustomMessageEmbed, } from "../utils/customMessageEmbed.js";
export async function handleMemberJoin(member) {
    try {
        if (member.user.bot) {
            return;
        }
        incrementJoin(member.guild.id);
        if (member.joinedTimestamp) {
            saveMember(member.guild.id, member.id, member.joinedTimestamp);
        }
        if (!await isWelcomeEnabled(member.guild.id)) {
            return;
        }
        const welcomeChannelId = await getWelcomeChannel(member.guild.id);
        if (!welcomeChannelId) {
            return;
        }
        const channel = await member.guild.channels.fetch(welcomeChannelId);
        if (!channel ||
            !channel.isTextBased()) {
            console.error("[DumbledoreBot] ❌ Welcome channel not found");
            return;
        }
        const customMessage = await getRandomWelcomeMessage(member.guild.id);
        let content = null;
        let embed = null;
        if (customMessage) {
            // Custom message built via the dashboard's welcome message
            // editor — resolve {macro} placeholders in every text field.
            // <#channelId> / <@&roleId> mentions inserted by the dashboard
            // need no extra handling; Discord renders those natively.
            const built = buildCustomMessageEmbed(customMessage, (text) => resolveWelcomeMacros(text, member), EMBED_COLOR);
            content = built.content;
            embed = built.embed;
        }
        else {
            // No custom messages configured for this guild yet — fall back
            // to the original hard-coded rotation so welcomes keep working
            // out of the box.
            const randomMessage = welcomeMessages[Math.floor(Math.random() *
                welcomeMessages.length)];
            const welcomeText = randomMessage.replace("{user}", member.toString());
            content = member.toString();
            embed =
                new EmbedBuilder()
                    .setColor(EMBED_COLOR)
                    .setTitle("🎉 Welcome!")
                    .setDescription(welcomeText)
                    .addFields({
                    name: "👥 Members",
                    value: member.guild.memberCount.toString(),
                    inline: true,
                })
                    .setThumbnail(member.user.displayAvatarURL())
                    .setFooter({
                    text: "Albus Dumbledore Bot",
                })
                    .setTimestamp();
        }
        await channel.send({
            content: content ?? undefined,
            embeds: embed ? [embed] : [],
        });
        console.log(`[DumbledoreBot] 👋 Welcomed ${member.user.tag}`);
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ Welcome handler error:", error);
    }
}
