import { db, } from "./database.js";
function mapSortingProfile(row) {
    return {
        guildId: row.guild_id,
        userId: row.user_id,
        house: row.house,
        sortedAt: row.sorted_at,
    };
}
function mapSortingLog(row) {
    return {
        id: row.id,
        guildId: row.guild_id,
        userId: row.user_id,
        oldHouse: row.old_house,
        newHouse: row.new_house,
        sortedAt: row.sorted_at,
        sortedBy: row.sorted_by,
        reason: row.reason,
    };
}
export async function getSortingProfile(guildId, userId) {
    const { rows } = await db.query(`
            SELECT
                guild_id,
                user_id,
                house,
                sorted_at
            FROM sorting_profiles
            WHERE guild_id = $1
            AND user_id = $2
            `, [
        guildId,
        userId,
    ]);
    if (rows.length === 0) {
        return null;
    }
    return mapSortingProfile(rows[0]);
}
export async function createSortingProfile(guildId, userId, house) {
    await db.query(`
        INSERT INTO sorting_profiles (
            guild_id,
            user_id,
            house,
            sorted_at
        )
        VALUES (
            $1,
            $2,
            $3,
            $4
        )
        `, [
        guildId,
        userId,
        house,
        Date.now(),
    ]);
}
export async function updateSortingProfile(guildId, userId, house) {
    await db.query(`
        UPDATE sorting_profiles
        SET
            house = $1,
            sorted_at = $2
        WHERE guild_id = $3
        AND user_id = $4
        `, [
        house,
        Date.now(),
        guildId,
        userId,
    ]);
}
export async function saveSortingProfile(guildId, userId, house) {
    const existing = await getSortingProfile(guildId, userId);
    if (existing) {
        await updateSortingProfile(guildId, userId, house);
        return;
    }
    await createSortingProfile(guildId, userId, house);
}
export async function createSortingLog(guildId, userId, oldHouse, newHouse, sortedBy, reason) {
    await db.query(`
        INSERT INTO sorting_logs (
            guild_id,
            user_id,
            old_house,
            new_house,
            sorted_at,
            sorted_by,
            reason
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
        )
        `, [
        guildId,
        userId,
        oldHouse,
        newHouse,
        Date.now(),
        sortedBy,
        reason,
    ]);
}
export async function getSortingHistory(guildId, userId) {
    const { rows } = await db.query(`
            SELECT
                id,
                guild_id,
                user_id,
                old_house,
                new_house,
                sorted_at,
                sorted_by,
                reason
            FROM sorting_logs
            WHERE guild_id = $1
            AND user_id = $2
            ORDER BY sorted_at DESC
            `, [
        guildId,
        userId,
    ]);
    return rows.map(mapSortingLog);
}
export async function getSortedStudentCount(guildId) {
    const { rows } = await db.query(`
            SELECT COUNT(*)::int AS count
            FROM sorting_profiles
            WHERE guild_id = $1
            `, [
        guildId,
    ]);
    return rows[0].count;
}
export async function getHouseMemberCount(guildId, house) {
    const { rows } = await db.query(`
            SELECT COUNT(*)::int AS count
            FROM sorting_profiles
            WHERE guild_id = $1
            AND house = $2
            `, [
        guildId,
        house,
    ]);
    return rows[0].count;
}
