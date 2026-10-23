import { db, } from "./database.js";
export async function saveTrace(guildId, userId, channelId, messageId, preview, createdAt) {
    await db.query(`
        INSERT INTO deluminator_traces (
            guild_id,
            user_id,
            channel_id,
            message_id,
            preview,
            created_at
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
        )
        ON CONFLICT (
            guild_id,
            user_id
        )
        DO UPDATE SET
            channel_id = EXCLUDED.channel_id,
            message_id = EXCLUDED.message_id,
            preview = EXCLUDED.preview,
            created_at = EXCLUDED.created_at
        `, [
        guildId,
        userId,
        channelId,
        messageId,
        preview,
        createdAt,
    ]);
}
export async function getTrace(guildId, userId) {
    const { rows, } = await db.query(`
        SELECT
            guild_id,
            user_id,
            channel_id,
            message_id,
            preview,
            created_at
        FROM deluminator_traces
        WHERE guild_id = $1
        AND user_id = $2
        `, [
        guildId,
        userId,
    ]);
    if (rows.length === 0) {
        return null;
    }
    const result = rows[0];
    return {
        guildId: result.guild_id,
        userId: result.user_id,
        channelId: result.channel_id,
        messageId: result.message_id,
        preview: result.preview,
        createdAt: Number(result.created_at),
    };
}
export async function deleteTrace(guildId, userId) {
    await db.query(`
        DELETE FROM deluminator_traces
        WHERE guild_id = $1
        AND user_id = $2
        `, [
        guildId,
        userId,
    ]);
}
export async function getTraceCount(guildId) {
    const { rows, } = await db.query(`
        SELECT COUNT(*) AS count
        FROM deluminator_traces
        WHERE guild_id = $1
        `, [
        guildId,
    ]);
    return Number(rows[0].count);
}
