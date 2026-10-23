import { db, } from "./database.js";
/**
 * Calendar-day bucket used by every analytics table, in the bot's single
 * source-of-truth timezone (UTC). Using UTC (rather than each guild's
 * local time) keeps day boundaries unambiguous across guilds and avoids
 * the dashboard having to reconcile per-guild timezones.
 */
export function getUtcDateString(date = new Date()) {
    return date
        .toISOString()
        .slice(0, 10);
}
function daysAgoDateString(days) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() -
        days);
    return getUtcDateString(date);
}
// ----------------------------------------------------------------------
// WRITE (flush) - all additive. Called once per guild per flush cycle,
// never once per message/command.
// ----------------------------------------------------------------------
/**
 * Persists one guild's accumulated in-memory counters for a single day.
 * Runs every write for that guild in one transaction so a flush either
 * lands completely or not at all - we never want messages recorded
 * without their matching command/summon/member counters for the period.
 */
export async function flushGuildAnalytics(batch) {
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        if (batch.messageCount > 0) {
            await client.query(`
                INSERT INTO analytics_message_daily (
                    guild_id,
                    date,
                    message_count
                )
                VALUES (
                    $1,
                    $2,
                    $3
                )
                ON CONFLICT (
                    guild_id,
                    date
                )
                DO UPDATE SET
                    message_count = analytics_message_daily.message_count + EXCLUDED.message_count
                `, [
                batch.guildId,
                batch.date,
                batch.messageCount,
            ]);
        }
        if (batch.summonCount > 0) {
            await client.query(`
                INSERT INTO analytics_summon_daily (
                    guild_id,
                    date,
                    summon_count
                )
                VALUES (
                    $1,
                    $2,
                    $3
                )
                ON CONFLICT (
                    guild_id,
                    date
                )
                DO UPDATE SET
                    summon_count = analytics_summon_daily.summon_count + EXCLUDED.summon_count
                `, [
                batch.guildId,
                batch.date,
                batch.summonCount,
            ]);
        }
        if (batch.joinCount > 0 ||
            batch.leaveCount > 0) {
            await client.query(`
                INSERT INTO analytics_member_daily (
                    guild_id,
                    date,
                    joins,
                    leaves
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4
                )
                ON CONFLICT (
                    guild_id,
                    date
                )
                DO UPDATE SET
                    joins = analytics_member_daily.joins + EXCLUDED.joins,
                    leaves = analytics_member_daily.leaves + EXCLUDED.leaves
                `, [
                batch.guildId,
                batch.date,
                batch.joinCount,
                batch.leaveCount,
            ]);
        }
        for (const [commandName, count,] of batch.commandCounts) {
            if (count <= 0) {
                continue;
            }
            await client.query(`
                INSERT INTO analytics_command_daily (
                    guild_id,
                    date,
                    command_name,
                    execution_count
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4
                )
                ON CONFLICT (
                    guild_id,
                    date,
                    command_name
                )
                DO UPDATE SET
                    execution_count = analytics_command_daily.execution_count + EXCLUDED.execution_count
                `, [
                batch.guildId,
                batch.date,
                commandName,
                count,
            ]);
            await client.query(`
                INSERT INTO analytics_command_totals (
                    guild_id,
                    command_name,
                    total_executions
                )
                VALUES (
                    $1,
                    $2,
                    $3
                )
                ON CONFLICT (
                    guild_id,
                    command_name
                )
                DO UPDATE SET
                    total_executions = analytics_command_totals.total_executions + EXCLUDED.total_executions
                `, [
                batch.guildId,
                commandName,
                count,
            ]);
        }
        const totalCommands = Array.from(batch.commandCounts.values()).reduce((sum, count) => sum +
            count, 0);
        if (batch.messageCount > 0 ||
            totalCommands > 0 ||
            batch.summonCount > 0 ||
            batch.joinCount > 0 ||
            batch.leaveCount > 0) {
            await client.query(`
                INSERT INTO analytics_guild_totals (
                    guild_id,
                    total_messages,
                    total_commands,
                    total_summons,
                    total_joins,
                    total_leaves
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6
                )
                ON CONFLICT (guild_id)
                DO UPDATE SET
                    total_messages = analytics_guild_totals.total_messages + EXCLUDED.total_messages,
                    total_commands = analytics_guild_totals.total_commands + EXCLUDED.total_commands,
                    total_summons = analytics_guild_totals.total_summons + EXCLUDED.total_summons,
                    total_joins = analytics_guild_totals.total_joins + EXCLUDED.total_joins,
                    total_leaves = analytics_guild_totals.total_leaves + EXCLUDED.total_leaves
                `, [
                batch.guildId,
                batch.messageCount,
                totalCommands,
                batch.summonCount,
                batch.joinCount,
                batch.leaveCount,
            ]);
        }
        await client.query("COMMIT");
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
/**
 * Overwrites (not adds to) today's member_count gauge for a guild. Called
 * once per day by analyticsScheduler, not on every join/leave.
 */
export async function recordMemberSnapshot(guildId, date, memberCount) {
    await db.query(`
        INSERT INTO analytics_member_daily (
            guild_id,
            date,
            member_count
        )
        VALUES (
            $1,
            $2,
            $3
        )
        ON CONFLICT (
            guild_id,
            date
        )
        DO UPDATE SET
            member_count = EXCLUDED.member_count
        `, [
        guildId,
        date,
        memberCount,
    ]);
}
// ----------------------------------------------------------------------
// READ (dashboard queries)
// ----------------------------------------------------------------------
async function sumMessagesSince(guildId, sinceDate) {
    const { rows, } = await db.query(`
        SELECT
            COALESCE(SUM(message_count), 0) AS total
        FROM analytics_message_daily
        WHERE guild_id = $1
        AND date >= $2
        `, [
        guildId,
        sinceDate,
    ]);
    return Number(rows[0]?.total ??
        0);
}
export async function getMessagesToday(guildId) {
    return sumMessagesSince(guildId, getUtcDateString());
}
export async function getMessagesThisWeek(guildId) {
    return sumMessagesSince(guildId, daysAgoDateString(6));
}
export async function getMessagesThisMonth(guildId) {
    return sumMessagesSince(guildId, daysAgoDateString(29));
}
export async function getDailyMessageGraph(guildId, days = 30) {
    const { rows, } = await db.query(`
        SELECT
            date,
            message_count
        FROM analytics_message_daily
        WHERE guild_id = $1
        AND date >= $2
        ORDER BY date ASC
        `, [
        guildId,
        daysAgoDateString(days - 1),
    ]);
    return rows.map((row) => ({
        date: row.date,
        count: Number(row.message_count),
    }));
}
async function sumSummonsSince(guildId, sinceDate) {
    const { rows, } = await db.query(`
        SELECT
            COALESCE(SUM(summon_count), 0) AS total
        FROM analytics_summon_daily
        WHERE guild_id = $1
        AND date >= $2
        `, [
        guildId,
        sinceDate,
    ]);
    return Number(rows[0]?.total ??
        0);
}
export async function getSummonStats(guildId) {
    const [totals, today, thisWeek, thisMonth,] = await Promise.all([
        getGuildTotals(guildId),
        sumSummonsSince(guildId, getUtcDateString()),
        sumSummonsSince(guildId, daysAgoDateString(6)),
        sumSummonsSince(guildId, daysAgoDateString(29)),
    ]);
    return {
        total: totals.totalSummons,
        today,
        thisWeek,
        thisMonth,
    };
}
export async function getGuildTotals(guildId) {
    const { rows, } = await db.query(`
        SELECT
            total_messages,
            total_commands,
            total_summons,
            total_joins,
            total_leaves
        FROM analytics_guild_totals
        WHERE guild_id = $1
        `, [
        guildId,
    ]);
    const row = rows[0] ??
        {};
    return {
        totalMessages: Number(row.total_messages ??
            0),
        totalCommands: Number(row.total_commands ??
            0),
        totalSummons: Number(row.total_summons ??
            0),
        totalJoins: Number(row.total_joins ??
            0),
        totalLeaves: Number(row.total_leaves ??
            0),
    };
}
/**
 * Sums totals across every guild the bot is in - used for the bot-wide
 * "General" dashboard section rather than a single-guild view.
 */
export async function getGlobalTotals() {
    const { rows, } = await db.query(`
        SELECT
            COALESCE(SUM(total_messages), 0) AS total_messages,
            COALESCE(SUM(total_commands), 0) AS total_commands,
            COALESCE(SUM(total_summons), 0) AS total_summons,
            COALESCE(SUM(total_joins), 0) AS total_joins,
            COALESCE(SUM(total_leaves), 0) AS total_leaves
        FROM analytics_guild_totals
        `);
    const row = rows[0] ??
        {};
    return {
        totalMessages: Number(row.total_messages ??
            0),
        totalCommands: Number(row.total_commands ??
            0),
        totalSummons: Number(row.total_summons ??
            0),
        totalJoins: Number(row.total_joins ??
            0),
        totalLeaves: Number(row.total_leaves ??
            0),
    };
}
export async function getTotalCommandExecutions(guildId) {
    const { rows, } = await db.query(`
        SELECT
            COALESCE(SUM(total_executions), 0) AS total
        FROM analytics_command_totals
        WHERE guild_id = $1
        `, [
        guildId,
    ]);
    return Number(rows[0]?.total ??
        0);
}
export async function getMostUsedCommands(guildId, limit = 10) {
    const { rows, } = await db.query(`
        SELECT
            command_name,
            total_executions
        FROM analytics_command_totals
        WHERE guild_id = $1
        ORDER BY total_executions DESC
        LIMIT $2
        `, [
        guildId,
        limit,
    ]);
    return rows.map((row) => ({
        commandName: row.command_name,
        totalExecutions: Number(row.total_executions),
    }));
}
async function getCommandStatsSince(guildId, sinceDate) {
    const { rows, } = await db.query(`
        SELECT
            command_name,
            SUM(execution_count) AS total_executions
        FROM analytics_command_daily
        WHERE guild_id = $1
        AND date >= $2
        GROUP BY command_name
        ORDER BY total_executions DESC
        `, [
        guildId,
        sinceDate,
    ]);
    return rows.map((row) => ({
        commandName: row.command_name,
        totalExecutions: Number(row.total_executions),
    }));
}
export async function getCommandUsageToday(guildId) {
    return getCommandStatsSince(guildId, getUtcDateString());
}
export async function getCommandUsageThisWeek(guildId) {
    return getCommandStatsSince(guildId, daysAgoDateString(6));
}
export async function getCommandUsageForCommand(guildId, commandName) {
    const { rows, } = await db.query(`
        SELECT
            total_executions
        FROM analytics_command_totals
        WHERE guild_id = $1
        AND command_name = $2
        `, [
        guildId,
        commandName,
    ]);
    const [todayStats, weekStats,] = await Promise.all([
        getCommandStatsSince(guildId, getUtcDateString()),
        getCommandStatsSince(guildId, daysAgoDateString(6)),
    ]);
    const findCount = (stats) => stats.find((stat) => stat.commandName ===
        commandName)?.totalExecutions ??
        0;
    return {
        total: Number(rows[0]?.total_executions ??
            0),
        today: findCount(todayStats),
        thisWeek: findCount(weekStats),
    };
}
export async function getMemberDailyRows(guildId, days = 30) {
    const { rows, } = await db.query(`
        SELECT
            date,
            member_count,
            joins,
            leaves
        FROM analytics_member_daily
        WHERE guild_id = $1
        AND date >= $2
        ORDER BY date ASC
        `, [
        guildId,
        daysAgoDateString(days - 1),
    ]);
    return rows.map((row) => ({
        date: row.date,
        memberCount: row.member_count === null
            ? null
            : Number(row.member_count),
        joins: Number(row.joins),
        leaves: Number(row.leaves),
    }));
}
/**
 * Latest known member_count snapshot for a guild. Snapshots are taken once
 * a day, so this is the dashboard's best proxy for "current member count"
 * without the dashboard needing its own Discord API access.
 */
export async function getLatestMemberSnapshot(guildId) {
    const { rows, } = await db.query(`
        SELECT
            member_count
        FROM analytics_member_daily
        WHERE guild_id = $1
        AND member_count IS NOT NULL
        ORDER BY date DESC
        LIMIT 1
        `, [
        guildId,
    ]);
    if (rows.length === 0 ||
        rows[0].member_count === null) {
        return null;
    }
    return Number(rows[0].member_count);
}
/**
 * Growth over the trailing window = latest snapshot - the snapshot closest
 * to (but not after) `daysAgo`. Falls back to null when there isn't a
 * snapshot old enough yet (e.g. a guild younger than the window).
 */
async function getMemberGrowthOverDays(guildId, daysAgo) {
    const { rows, } = await db.query(`
        SELECT
            member_count
        FROM analytics_member_daily
        WHERE guild_id = $1
        AND member_count IS NOT NULL
        AND date <= $2
        ORDER BY date DESC
        LIMIT 1
        `, [
        guildId,
        daysAgoDateString(daysAgo),
    ]);
    if (rows.length === 0) {
        return null;
    }
    const latest = await getLatestMemberSnapshot(guildId);
    if (latest === null) {
        return null;
    }
    return (latest -
        Number(rows[0].member_count));
}
export async function getWeeklyMemberGrowth(guildId) {
    return getMemberGrowthOverDays(guildId, 7);
}
export async function getMonthlyMemberGrowth(guildId) {
    return getMemberGrowthOverDays(guildId, 30);
}
export async function getJoinLeaveCounts(guildId) {
    const totals = await getGuildTotals(guildId);
    return {
        totalJoins: totals.totalJoins,
        totalLeaves: totals.totalLeaves,
    };
}
