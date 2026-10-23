import { flushGuildAnalytics, getUtcDateString, } from "./analyticsService.js";
function createEmptyCounters() {
    return {
        messageCount: 0,
        summonCount: 0,
        joinCount: 0,
        leaveCount: 0,
        commandCounts: new Map(),
    };
}
let counters = new Map();
function getOrCreateCounters(guildId) {
    let guildCounters = counters.get(guildId);
    if (!guildCounters) {
        guildCounters =
            createEmptyCounters();
        counters.set(guildId, guildCounters);
    }
    return guildCounters;
}
export function incrementMessage(guildId) {
    const guildCounters = getOrCreateCounters(guildId);
    guildCounters.messageCount++;
}
/**
 * Only call this after the bot has actually sent a reply - a triggered
 * summon that failed to send (see messageHandler.ts's catch block) must
 * never be counted.
 */
export function incrementSummon(guildId) {
    const guildCounters = getOrCreateCounters(guildId);
    guildCounters.summonCount++;
}
export function incrementCommand(guildId, commandName) {
    const guildCounters = getOrCreateCounters(guildId);
    guildCounters.commandCounts.set(commandName, (guildCounters.commandCounts.get(commandName) ??
        0) + 1);
}
export function incrementJoin(guildId) {
    getOrCreateCounters(guildId).joinCount++;
}
export function incrementLeave(guildId) {
    getOrCreateCounters(guildId).leaveCount++;
}
/**
 * Drains every guild's counters and persists them, tagging the batch with
 * the UTC calendar day it is being flushed on. The map is swapped out
 * before any `await`, so increments that happen *during* the flush land
 * in a fresh map instead of being lost or double-counted - the tracker is
 * always safe to keep writing to, even mid-flush.
 *
 * Guilds are flushed concurrently since each is an independent unit of
 * work; a slow/failing guild write doesn't block the others.
 */
export async function flush() {
    if (counters.size === 0) {
        return;
    }
    const drained = counters;
    counters =
        new Map();
    const date = getUtcDateString();
    const results = await Promise.allSettled(Array.from(drained.entries()).map(([guildId, guildCounters,]) => {
        const batch = {
            guildId,
            date,
            messageCount: guildCounters.messageCount,
            summonCount: guildCounters.summonCount,
            joinCount: guildCounters.joinCount,
            leaveCount: guildCounters.leaveCount,
            commandCounts: guildCounters.commandCounts,
        };
        return flushGuildAnalytics(batch);
    }));
    for (const result of results) {
        if (result.status === "rejected") {
            console.error("[DumbledoreBot] ❌ Analytics flush failed for a guild:", result.reason);
        }
    }
}
/**
 * True when there is anything worth flushing. Lets the scheduler skip a
 * no-op DB round trip on quiet servers.
 */
export function hasPendingData() {
    return counters.size > 0;
}
