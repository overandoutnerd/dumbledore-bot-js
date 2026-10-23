import { flush, hasPendingData, } from "./analyticsTracker.js";
import { getUtcDateString, recordMemberSnapshot, } from "./analyticsService.js";
// ============================================================================
// Two independent timers:
//
// 1. A flush every FLUSH_INTERVAL_MS, which persists whatever
//    analyticsTracker has collected since the last flush. This is the
//    "acceptable to lose at most 30 minutes on crash" tradeoff from the
//    spec - counters only live in memory between flushes.
//
// 2. A once-a-minute UTC-day-change check. Ticking every minute (rather
//    than scheduling a single setTimeout for midnight) keeps this robust
//    to the process being paused/resumed (e.g. host sleep) - it just
//    notices the date changed whenever it next gets to run, rather than
//    relying on a timer that fired at an exact wall-clock moment. When
//    the day rolls over it does a final flush of the day that just ended
//    (per the spec: "perform one final flush before daily reset") and
//    then takes a fresh member_count snapshot for every guild so the new
//    day has a starting gauge value.
// ============================================================================
const FLUSH_INTERVAL_MS = 5 * 60 * 1000;
const DAY_CHANGE_CHECK_INTERVAL_MS = 60 * 1000;
async function flushIfPending() {
    if (!hasPendingData()) {
        return;
    }
    try {
        let lastError;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                await flush();
                console.log("[DumbledoreBot] 📊 Analytics flushed");
                return;
            }
            catch (error) {
                const retryable = [
                    "ETIMEDOUT",
                    "ECONNRESET",
                    "ENETUNREACH",
                    "EHOSTUNREACH",
                ];
                if (!retryable.includes(error?.code) ||
                    attempt === 3) {
                    throw error;
                }
                console.warn(`[Analytics] Flush failed (${error.code}), retrying (${attempt}/3)...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
        throw lastError;
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ Analytics flush error:", error);
    }
}
async function captureMemberSnapshots(client) {
    const date = getUtcDateString();
    for (const guild of client.guilds.cache.values()) {
        try {
            await recordMemberSnapshot(guild.id, date, guild.memberCount);
        }
        catch (error) {
            console.error(`[DumbledoreBot] ❌ Member snapshot failed for guild ${guild.id}:`, error);
        }
    }
    console.log("[DumbledoreBot] 📸 Member snapshots captured");
}
export function startAnalyticsScheduler(client) {
    console.log("[DumbledoreBot] 📊 Analytics scheduler started");
    let lastSeenDate = getUtcDateString();
    setInterval(() => {
        void flushIfPending();
    }, FLUSH_INTERVAL_MS);
    setInterval(() => {
        const currentDate = getUtcDateString();
        if (currentDate ===
            lastSeenDate) {
            return;
        }
        lastSeenDate =
            currentDate;
        void (async () => {
            // Flush before taking the snapshot so any counters
            // still tagged with the day that just ended are
            // persisted first, then the new day starts clean.
            await flushIfPending();
            await captureMemberSnapshots(client);
        })();
    }, DAY_CHANGE_CHECK_INTERVAL_MS);
    // Baseline snapshot so "today" has a member_count row immediately on
    // startup instead of waiting for the first day rollover.
    void captureMemberSnapshots(client);
}
/**
 * Best-effort final flush for graceful shutdowns (SIGINT/SIGTERM). Not a
 * substitute for the periodic flush - just shrinks the crash-loss window
 * on a clean restart/deploy.
 */
export async function flushOnShutdown() {
    await flushIfPending();
}
