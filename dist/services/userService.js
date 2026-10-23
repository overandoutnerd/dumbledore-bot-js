import { db, } from "./database.js";
export async function createUser(guildId, userId) {
    await db.query(`
        INSERT INTO users (
            guild_id,
            user_id,
            xp,
            messages,
            last_xp_at
        )
        VALUES ($1, $2, 0, 0, 0)
        ON CONFLICT (guild_id, user_id)
        DO NOTHING
        `, [
        guildId,
        userId,
    ]);
}
export async function getUser(guildId, userId) {
    const { rows, } = await db.query(`
        SELECT
            guild_id,
            user_id,
            xp,
            messages,
            last_xp_at
        FROM users
        WHERE guild_id = $1
        AND user_id = $2
        `, [
        guildId,
        userId,
    ]);
    if (rows.length === 0) {
        return null;
    }
    const user = rows[0];
    return {
        guildId: user.guild_id,
        userId: user.user_id,
        xp: user.xp,
        messages: user.messages,
        lastXpAt: Number(user.last_xp_at),
    };
}
export async function getOrCreateUser(guildId, userId) {
    await createUser(guildId, userId);
    const user = await getUser(guildId, userId);
    if (!user) {
        throw new Error("Failed to create user.");
    }
    return user;
}
export async function updateUser(user) {
    await db.query(`
        UPDATE users
        SET
            xp = $1,
            messages = $2,
            last_xp_at = $3
        WHERE guild_id = $4
        AND user_id = $5
        `, [
        user.xp,
        user.messages,
        user.lastXpAt,
        user.guildId,
        user.userId,
    ]);
}
export async function addXp(guildId, userId, xp) {
    await createUser(guildId, userId);
    await db.query(`
        UPDATE users
        SET xp = GREATEST(0, xp + $1)
        WHERE guild_id = $2
        AND user_id = $3
        `, [
        xp,
        guildId,
        userId,
    ]);
}
export async function incrementMessages(guildId, userId) {
    await createUser(guildId, userId);
    await db.query(`
        UPDATE users
        SET messages = messages + 1
        WHERE guild_id = $1
        AND user_id = $2
        `, [
        guildId,
        userId,
    ]);
}
export async function updateLastXpAt(guildId, userId, timestamp) {
    await createUser(guildId, userId);
    await db.query(`
        UPDATE users
        SET last_xp_at = $1
        WHERE guild_id = $2
        AND user_id = $3
        `, [
        timestamp,
        guildId,
        userId,
    ]);
}
export async function getLeaderboard(guildId, limit = 10) {
    const { rows, } = await db.query(`
        SELECT
            guild_id,
            user_id,
            xp,
            messages,
            last_xp_at
        FROM users
        WHERE guild_id = $1
        ORDER BY xp DESC
        LIMIT $2
        `, [
        guildId,
        limit,
    ]);
    const users = rows;
    return users.map((user) => ({
        guildId: user.guild_id,
        userId: user.user_id,
        xp: Number(user.xp),
        messages: Number(user.messages),
        lastXpAt: Number(user.last_xp_at),
    }));
}
export async function getUserRank(guildId, userId) {
    const { rows, } = await db.query(`
        SELECT
            COUNT(*) + 1 AS rank
        FROM users
        WHERE guild_id = $1
        AND xp > (
            SELECT xp
            FROM users
            WHERE guild_id = $1
            AND user_id = $2
        )
        `, [
        guildId,
        userId,
    ]);
    if (rows.length === 0) {
        return 0;
    }
    return Number(rows[0].rank);
}
