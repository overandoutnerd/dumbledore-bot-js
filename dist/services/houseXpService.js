import { db, } from "./database.js";
function emptyTotals() {
    return {
        gryffindor: 0,
        ravenclaw: 0,
        hufflepuff: 0,
        slytherin: 0,
    };
}
/**
 * Adds (or subtracts, for negative deltas) XP to a user's row for the
 * given house. Clamped at 0 - a house's banked XP never goes negative,
 * mirroring how housePointsService.addHousePoints behaves.
 */
export async function addHouseXp(guildId, userId, houseName, delta) {
    if (delta === 0) {
        return;
    }
    await db.query(`
        INSERT INTO house_xp (
            guild_id,
            user_id,
            house_name,
            xp
        )
        VALUES (
            $1,
            $2,
            $3,
            GREATEST(0, $4)
        )
        ON CONFLICT (
            guild_id,
            user_id,
            house_name
        )
        DO UPDATE SET
            xp = GREATEST(
                0,
                house_xp.xp + $4
            )
        `, [
        guildId,
        userId,
        houseName,
        delta,
    ]);
}
/**
 * Sum of banked XP for a single house - includes XP earned by members who
 * have since left that house, by design (see module comment above).
 */
export async function getHouseXpTotal(guildId, houseName) {
    const { rows, } = await db.query(`
        SELECT
            COALESCE(SUM(xp), 0) AS total
        FROM house_xp
        WHERE guild_id = $1
        AND house_name = $2
        `, [
        guildId,
        houseName,
    ]);
    return Number(rows[0]?.total ?? 0);
}
/** Sum of banked XP for every house in one query. */
export async function getAllHouseXpTotals(guildId) {
    const { rows, } = await db.query(`
        SELECT
            house_name,
            COALESCE(SUM(xp), 0) AS total
        FROM house_xp
        WHERE guild_id = $1
        GROUP BY house_name
        `, [
        guildId,
    ]);
    const totals = emptyTotals();
    for (const row of rows) {
        totals[row.house_name] =
            Number(row.total);
    }
    return totals;
}
/** Per-house breakdown of banked XP for a single user, e.g. for /profile. */
export async function getUserHouseXp(guildId, userId) {
    const { rows, } = await db.query(`
        SELECT
            house_name,
            xp
        FROM house_xp
        WHERE guild_id = $1
        AND user_id = $2
        `, [
        guildId,
        userId,
    ]);
    const totals = emptyTotals();
    return totals;
}
/**
 * User IDs that have banked at least `minXp` for a given house - i.e.
 * members who have actually contributed, as opposed to everyone currently
 * holding the house role. Used to compute the House Cup average over
 * contributors only. `minXp` is per-guild configurable (default
 * MIN_XP_FOR_CONTRIBUTOR - see guildSettingsService.ts:getMinXpForContributor)
 * so callers must pass it explicitly rather than relying on a hidden default.
 */
export async function getHouseContributorUserIds(guildId, houseName, minXp) {
    const { rows, } = await db.query(`
        SELECT
            user_id
        FROM house_xp
        WHERE guild_id = $1
        AND house_name = $2
        AND xp >= $3
        `, [
        guildId,
        houseName,
        minXp,
    ]);
    return new Set(rows.map((row) => row.user_id));
}
/**
 * Top N members by banked XP for a house - used by the House Cup board's
 * per-house detail view. Includes ex-members of the house the same way
 * the house's total does (see module comment above) - someone who
 * contributed heavily before switching houses still shows up here.
 */
export async function getTopHouseContributors(guildId, houseName, limit = 5) {
    const { rows, } = await db.query(`
        SELECT
            user_id,
            xp
        FROM house_xp
        WHERE guild_id = $1
        AND house_name = $2
        AND xp > 0
        ORDER BY xp DESC
        LIMIT $3
        `, [
        guildId,
        houseName,
        limit,
    ]);
    return rows.map((row) => ({
        userId: row.user_id,
        xp: Number(row.xp),
    }));
}
