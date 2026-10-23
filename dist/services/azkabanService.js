import { db, } from "./database.js";
function mapPrisoner(prisoner) {
    return {
        id: Number(prisoner.id),
        guildId: prisoner.guild_id,
        userId: prisoner.user_id,
        moderatorId: prisoner.moderator_id,
        reason: prisoner.reason,
        jailedAt: Number(prisoner.jailed_at),
        releasedAt: prisoner.released_at ===
            null
            ? null
            : Number(prisoner.released_at),
        isActive: prisoner.is_active,
        rolesJson: prisoner.roles_json,
    };
}
export async function imprisonUser(guildId, userId, moderatorId, reason, roleIds) {
    await db.query(`
        INSERT INTO azkaban_prisoners (
            guild_id,
            user_id,
            moderator_id,
            reason,
            jailed_at,
            released_at,
            is_active,
            roles_json
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
        guildId,
        userId,
        moderatorId,
        reason,
        Date.now(),
        null,
        true,
        JSON.stringify(roleIds),
    ]);
}
export async function pardonUser(guildId, userId) {
    await db.query(`
        UPDATE azkaban_prisoners
        SET
            is_active = FALSE,
            released_at = $1
        WHERE guild_id = $2
        AND user_id = $3
        AND is_active = TRUE
        `, [
        Date.now(),
        guildId,
        userId,
    ]);
}
export async function getPrisoner(guildId, userId) {
    const { rows, } = await db.query(`
        SELECT
            id,
            guild_id,
            user_id,
            moderator_id,
            reason,
            jailed_at,
            released_at,
            is_active,
            roles_json
        FROM azkaban_prisoners
        WHERE guild_id = $1
        AND user_id = $2
        AND is_active = TRUE
        ORDER BY jailed_at DESC
        LIMIT 1
        `, [
        guildId,
        userId,
    ]);
    if (rows.length === 0) {
        return null;
    }
    return mapPrisoner(rows[0]);
}
export async function isPrisoner(guildId, userId) {
    return (await getPrisoner(guildId, userId)) !== null;
}
export async function getSavedRoles(guildId, userId) {
    const prisoner = await getPrisoner(guildId, userId);
    if (!prisoner) {
        return [];
    }
    try {
        return JSON.parse(prisoner.rolesJson);
    }
    catch {
        return [];
    }
}
export async function getAllPrisoners(guildId) {
    const { rows, } = await db.query(`
        SELECT
            id,
            guild_id,
            user_id,
            moderator_id,
            reason,
            jailed_at,
            released_at,
            is_active,
            roles_json
        FROM azkaban_prisoners
        WHERE guild_id = $1
        ORDER BY jailed_at DESC
        `, [
        guildId,
    ]);
    return rows.map(mapPrisoner);
}
export async function getPrisonHistory(guildId, userId) {
    const { rows, } = await db.query(`
        SELECT
            id,
            guild_id,
            user_id,
            moderator_id,
            reason,
            jailed_at,
            released_at,
            is_active,
            roles_json
        FROM azkaban_prisoners
        WHERE guild_id = $1
        AND user_id = $2
        ORDER BY jailed_at DESC
        `, [
        guildId,
        userId,
    ]);
    return rows.map(mapPrisoner);
}
