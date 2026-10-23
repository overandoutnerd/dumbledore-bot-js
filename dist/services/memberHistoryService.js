import { db, } from "./database.js";
export async function saveMember(guildId, userId, joinedAt) {
    await db.query(`
        INSERT INTO member_history (
            guild_id,
            user_id,
            joined_at
        )
        VALUES (
            $1,
            $2,
            $3
        )
        ON CONFLICT (
            guild_id,
            user_id
        )
        DO NOTHING
        `, [
        guildId,
        userId,
        joinedAt,
    ]);
}
export async function memberExists(guildId, userId) {
    const { rows, } = await db.query(`
        SELECT 1
        FROM member_history
        WHERE guild_id = $1
        AND user_id = $2
        LIMIT 1
        `, [
        guildId,
        userId,
    ]);
    return rows.length > 0;
}
export async function getOldestMembers(guildId, limit = 5) {
    const { rows, } = await db.query(`
        SELECT
            guild_id,
            user_id,
            joined_at
        FROM member_history
        WHERE guild_id = $1
        ORDER BY joined_at ASC
        LIMIT $2
        `, [
        guildId,
        limit,
    ]);
    const members = rows;
    return members.map((member) => ({
        guildId: member.guild_id,
        userId: member.user_id,
        joinedAt: Number(member.joined_at),
    }));
}
