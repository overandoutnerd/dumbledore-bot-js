import { EmbedBuilder, } from "discord.js";
import { getPendingReminders, markReminderSent, } from "../services/bumpService.js";
import { isBumpEnabled, } from "../services/guildSettingsService.js";
import { getRandomBumpReminderMessage, } from "../services/bumpReminderMessagesService.js";
import { resolveBumpMacros, } from "../utils/bumpMacros.js";
import { buildCustomMessageEmbed, } from "../utils/customMessageEmbed.js";
const BUMP_COOLDOWN_MS = 2 * 60 * 60 * 1000;
// ============================================================================
// This used to poll Postgres every 60 seconds, forever, asking "is anything
// due yet?" - a real query on a fixed timer, independent of whether a bump
// had happened, whether bump was even enabled, or whether the bot had any
// Discord activity at all. With a 5-minute autosuspend delay on the Neon
// endpoint, a query every 60 seconds meant the endpoint could never go
// 5 minutes without traffic, so it never suspended - full stop, regardless
// of actual usage.
//
// Now: one `setTimeout` is scheduled per guild for the exact moment its
// next reminder is due, created the moment a bump happens (see
// scheduleBumpReminder(), called from bumpHandler.ts right after
// saveBump()). No recurring query. The only DB reads/writes this module
// does are:
//   - one catch-up SELECT at process startup, to re-arm timers for any
//     reminders that were still pending across a restart, and
//   - the UPDATE that marks a reminder as sent, at the moment it fires.
// ============================================================================
let discordClient = null;
const timers = new Map();
/** (Re)schedules a guild's next bump reminder for the exact time it's due,
 * replacing any timer already pending for that guild. Called right after a
 * successful bump is recorded. */
export function scheduleBumpReminder(guildId, channelId, lastBumpAt) {
    const existing = timers.get(guildId);
    if (existing) {
        clearTimeout(existing);
    }
    const delayMs = Math.max(0, lastBumpAt +
        BUMP_COOLDOWN_MS -
        Date.now());
    const timer = setTimeout(() => {
        void fireReminder(guildId, channelId);
    }, delayMs);
    // Don't let this timer keep the process alive on its own during
    // shutdown.
    timer.unref?.();
    timers.set(guildId, timer);
}
async function fireReminder(guildId, channelId) {
    timers.delete(guildId);
    try {
        if (!discordClient) {
            return;
        }
        // Checked at fire time (not schedule time) in case bump was
        // disabled in the meantime - this read is cached in-memory (see
        // guildSettingsService.ts), so it costs nothing extra here. If
        // it's off, we just drop the reminder silently: a mod who
        // disabled bump doesn't want to be reminded about it, and the
        // next real /bump (if bump is re-enabled) will schedule a fresh
        // timer anyway.
        if (!(await isBumpEnabled(guildId))) {
            return;
        }
        const channel = await discordClient.channels.fetch(channelId);
        if (!channel ||
            !channel.isTextBased()) {
            return;
        }
        const guild = discordClient.guilds.cache.get(guildId);
        const guildName = guild?.name ??
            "this server";
        const botDisplayName = guild?.members.me?.displayName ??
            discordClient.user?.username ??
            "Albus Dumbledore";
        // Custom variation built via the dashboard's reminder editor, chosen
        // at random - falls back to the original hard-coded embed below
        // when the guild hasn't configured any (or `guild` isn't cached,
        // which the custom path also needs for its macros).
        const customMessage = guild &&
            (await getRandomBumpReminderMessage(guildId));
        let content = undefined;
        let embed = null;
        if (customMessage &&
            guild) {
            const built = buildCustomMessageEmbed(customMessage, (text) => resolveBumpMacros(text, guild), 0x5865f2);
            content = built.content ?? undefined;
            embed = built.embed;
        }
        // Defensive fallback: no custom message configured, `guild` wasn't
        // cached (needed for macros), or an empty custom row would
        // otherwise try to send a message with neither content nor an
        // embed, which Discord rejects outright.
        if (!content &&
            !embed) {
            content = undefined;
            embed =
                new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setTitle("⏰ Time to Bump!")
                    .setDescription([
                    "The server can now be bumped again.",
                    "",
                    `Use </bump:947088344167366698> to help more witches and wizards discover ${guildName}.`,
                ].join("\n"))
                    .setFooter({
                    text: botDisplayName,
                })
                    .setTimestamp();
        }
        await channel.send({
            content,
            embeds: embed
                ? [
                    embed,
                ]
                : [],
        });
        await markReminderSent(guildId);
        console.log(`[DumbledoreBot] ⏰ Bump reminder sent for guild ${guildId}`);
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ Bump reminder error:", error);
    }
}
export function startBumpReminderChecker(client) {
    discordClient = client;
    console.log("[DumbledoreBot] ⏰ Bump reminder checker started");
    // One-time catch-up on startup only - re-arms timers for anything
    // that was still pending across a restart. This is the only query
    // this module ever runs that isn't triggered by an actual bump or an
    // actual reminder firing.
    void (async () => {
        try {
            const reminders = await getPendingReminders();
            for (const reminder of reminders) {
                scheduleBumpReminder(reminder.guildId, reminder.channelId, reminder.lastBumpAt);
            }
            console.log(`[DumbledoreBot] ⏰ Re-armed ${reminders.length} pending bump reminder(s) after startup`);
        }
        catch (error) {
            console.error("[DumbledoreBot] ❌ Failed to load pending bump reminders on startup:", error);
        }
    })();
}
