import { db, } from "./database.js";
function mapStarboardMessage(row) {
    return {
        messageId: row.message_id,
        guildId: row.guild_id,
        authorId: row.author_id,
        starboardMessageId: row.starboard_message_id,
        starCount: Number(row.star_count),
        createdAt: Number(row.created_at),
    };
}
export async function getStarboardMessage(messageId) {
    const { rows, } = await db.query(`
        SELECT
            message_id,
            guild_id,
            author_id,
            starboard_message_id,
            star_count,
            created_at
        FROM starboard_messages
        WHERE message_id = $1
        `, [
        messageId,
    ]);
    if (rows.length === 0) {
        return null;
    }
    return mapStarboardMessage(rows[0]);
}
export async function createStarboardMessage(messageId, guildId, authorId, starboardMessageId, starCount) {
    await db.query(`
        INSERT INTO starboard_messages (
            message_id,
            guild_id,
            author_id,
            starboard_message_id,
            star_count
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5
        )
        `, [
        messageId,
        guildId,
        authorId,
        starboardMessageId,
        starCount,
    ]);
}
export async function updateStarCount(messageId, starCount) {
    await db.query(`
        UPDATE starboard_messages
        SET
            star_count = $1
        WHERE message_id = $2
        `, [
        starCount,
        messageId,
    ]);
}
export async function updateStarboardMessageId(messageId, starboardMessageId) {
    await db.query(`
        UPDATE starboard_messages
        SET
            starboard_message_id = $1
        WHERE message_id = $2
        `, [
        starboardMessageId,
        messageId,
    ]);
}
export async function deleteStarboardMessage(messageId) {
    await db.query(`
        DELETE FROM starboard_messages
        WHERE message_id = $1
        `, [
        messageId,
    ]);
}
export async function getGuildStarboardMessages(guildId) {
    const { rows, } = await db.query(`
        SELECT
            message_id,
            guild_id,
            author_id,
            starboard_message_id,
            star_count,
            created_at
        FROM starboard_messages
        WHERE guild_id = $1
        ORDER BY
            star_count DESC,
            created_at DESC
        `, [
        guildId,
    ]);
    return rows.map(mapStarboardMessage);
}
export async function starboardMessageExists(messageId) {
    const { rows, } = await db.query(`
        SELECT 1
        FROM starboard_messages
        WHERE message_id = $1
        LIMIT 1
        `, [
        messageId,
    ]);
    return (rows.length > 0);
}
