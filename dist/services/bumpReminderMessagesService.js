import { db, } from "./database.js";
function mapRow(row) {
    return {
        id: Number(row.id),
        guildId: row.guild_id,
        outsideMessage: row.outside_message,
        embedAuthorName: row.embed_author_name,
        embedAuthorIconUrl: row.embed_author_icon_url,
        embedTitle: row.embed_title,
        embedDescription: row.embed_description,
        embedColor: row.embed_color,
        embedImageUrl: row.embed_image_url,
        embedThumbnailUrl: row.embed_thumbnail_url,
        embedFooterText: row.embed_footer_text,
        embedFooterIconUrl: row.embed_footer_icon_url,
        createdAt: Number(row.created_at),
        updatedAt: Number(row.updated_at),
    };
}
export async function listBumpReminderMessages(guildId) {
    const { rows, } = await db.query(`
        SELECT *
        FROM guild_bump_reminder_messages
        WHERE guild_id = $1
        ORDER BY created_at ASC
        `, [
        guildId,
    ]);
    return rows.map(mapRow);
}
/**
 * Picks one of the guild's custom reminder variations at random, or null if
 * none are configured yet - in which case the caller (bumpReminderHandler.ts)
 * falls back to the original hard-coded "⏰ Time to Bump!" embed so
 * reminders keep working out of the box.
 */
export async function getRandomBumpReminderMessage(guildId) {
    const { rows, } = await db.query(`
        SELECT *
        FROM guild_bump_reminder_messages
        WHERE guild_id = $1
        ORDER BY random()
        LIMIT 1
        `, [
        guildId,
    ]);
    return rows[0] ?
        mapRow(rows[0]) :
        null;
}
