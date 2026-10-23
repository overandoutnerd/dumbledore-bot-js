import { EmbedBuilder, } from "discord.js";
import { saveBump, } from "../services/bumpService.js";
import { scheduleBumpReminder, } from "./bumpReminderHandler.js";
import { getBumpXpValue, isBumpEnabled, isHouseCupEnabled, } from "../services/guildSettingsService.js";
import { getRandomBumpThankMessage, } from "../services/bumpThankMessagesService.js";
import { resolveBumpMacros, } from "../utils/bumpMacros.js";
import { buildCustomMessageEmbed, } from "../utils/customMessageEmbed.js";
import { getOrCreateUser, updateUser, } from "../services/userService.js";
import { addHouseXp, } from "../services/houseXpService.js";
import { getMemberHouse, } from "../utils/house.js";
const DISBOARD_BOT_ID = "302050872383242240";
/**
 * Awards bump XP (guild_settings.bump_xp_value, default BUMP_XP_VALUE) to
 * whoever ran the successful /bump, crediting their currently-held house
 * for the House Cup the same way a chat message or star reaction would
 * (see houseCupXpHandler.ts). Gated on House Cup being enabled, since this
 * XP only exists to feed that system; bump being enabled is already
 * checked by the caller. Silently does nothing if Discord didn't tell us
 * who ran the bump (interactionMetadata is absent for older text-command
 * bumps).
 */
async function awardBumpXp(guild, bumper) {
    try {
        if (!(await isHouseCupEnabled(guild.id))) {
            return;
        }
        const awardedXp = await getBumpXpValue(guild.id);
        if (awardedXp === 0) {
            return;
        }
        const user = await getOrCreateUser(guild.id, bumper.id);
        user.xp +=
            awardedXp;
        await updateUser(user);
        const member = await guild.members
            .fetch(bumper.id)
            .catch(() => null);
        if (!member) {
            return;
        }
        const house = await getMemberHouse(member);
        if (!house) {
            return;
        }
        await addHouseXp(guild.id, bumper.id, house, awardedXp);
        console.log(`[DumbledoreBot] ⭐ +${awardedXp} bump XP awarded to ${bumper.tag ?? bumper.id}`);
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ Bump XP award error:", error);
    }
}
export async function handleBump(message) {
    try {
        if (message.author.id !==
            DISBOARD_BOT_ID) {
            return;
        }
        const disboardEmbed = message.embeds[0];
        if (!disboardEmbed?.description) {
            return;
        }
        const isSuccessfulBump = disboardEmbed.description
            .toLowerCase()
            .includes("bump done");
        if (!isSuccessfulBump) {
            return;
        }
        if (!message.guild) {
            return;
        }
        if (!(await isBumpEnabled(message.guild.id))) {
            return;
        }
        console.log("[DumbledoreBot] 🚀 Successful DISBOARD bump detected");
        await saveBump(message.guild.id, message.channel.id);
        scheduleBumpReminder(message.guild.id, message.channel.id, Date.now());
        console.log(`[DumbledoreBot] 💾 Bump saved for guild ${message.guild.id}`);
        if (!message.channel.isSendable()) {
            return;
        }
        const bumper = message.interactionMetadata?.user;
        if (bumper) {
            await awardBumpXp(message.guild, bumper);
        }
        // Custom variation built via the dashboard's thank-you editor,
        // chosen at random - falls back to the original hard-coded embed
        // below when the guild hasn't configured any.
        const customMessage = await getRandomBumpThankMessage(message.guild.id);
        let content = undefined;
        let embed = null;
        if (customMessage) {
            const built = buildCustomMessageEmbed(customMessage, (text) => resolveBumpMacros(text, message.guild, bumper), 0xf59e0b);
            content = built.content ?? undefined;
            embed = built.embed;
        }
        // Defensive fallback: no custom message configured, or an empty
        // custom row would otherwise try to send a message with neither
        // content nor an embed, which Discord rejects outright.
        if (!content &&
            !embed) {
            const thanksText = bumper
                ? `Thank you ${bumper} for helping the server grow.`
                : "Thank you for helping the server grow.";
            embed =
                new EmbedBuilder()
                    .setColor(0xf59e0b)
                    .setTitle("🎉 Server Bumped!")
                    .setDescription([
                    thanksText,
                    "",
                    `Your bump has been recorded and helps more witches and wizards discover ${message.guild.name}.`,
                    "",
                    "⏰ **Next bump available in 2 hours.**",
                ].join("\n"))
                    .setFooter({
                    text: message.guild.members.me?.displayName ??
                        message.client.user.username,
                })
                    .setTimestamp();
        }
        await message.channel.send({
            content,
            embeds: embed
                ? [
                    embed,
                ]
                : [],
        });
        console.log("[DumbledoreBot] ✅ Bump thank-you message sent");
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ Bump handler error:", error);
    }
}
