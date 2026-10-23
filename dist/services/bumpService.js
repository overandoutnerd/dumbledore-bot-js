import { db, } from "./database.js";
export async function saveBump(guildId, channelId) {
    await db.query(`
        INSERT INTO bump_data (
            guild_id,
            channel_id,
            last_bump_at,
            reminder_sent
        )
        VALUES (
            $1,
            $2,
            $3,
            false
        )
        ON CONFLICT (guild_id)
        DO UPDATE SET
            channel_id = EXCLUDED.channel_id,
            last_bump_at = EXCLUDED.last_bump_at,
            reminder_sent = false
        `, [
        guildId,
        channelId,
        Date.now(),
    ]);
}
export async function getBumpData(guildId) {
    const { rows, } = await db.query(`
        SELECT
            guild_id,
            channel_id,
            last_bump_at,
            reminder_sent
        FROM bump_data
        WHERE guild_id = $1
        `, [
        guildId,
    ]);
    if (rows.length === 0) {
        return null;
    }
    const result = rows[0];
    return {
        guildId: result.guild_id,
        channelId: result.channel_id,
        lastBumpAt: Number(result.last_bump_at),
        reminderSent: Boolean(result.reminder_sent),
    };
}
export async function getPendingReminders() {
    const { rows, } = await db.query(`
        SELECT
            guild_id,
            channel_id,
            last_bump_at,
            reminder_sent
        FROM bump_data
        WHERE reminder_sent = false
        `);
    const results = rows;
    return results.map((row) => ({
        guildId: row.guild_id,
        channelId: row.channel_id,
        lastBumpAt: Number(row.last_bump_at),
        reminderSent: Boolean(row.reminder_sent),
    }));
}
export async function markReminderSent(guildId) {
    await db.query(`
        UPDATE bump_data
        SET reminder_sent = true
        WHERE guild_id = $1
        `, [
        guildId,
    ]);
}
