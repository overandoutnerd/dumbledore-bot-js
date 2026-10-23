import { randomUUID, } from "node:crypto";
import { db, } from "./database.js";
function parseTranscriptData(value) {
    if (!value) {
        return null;
    }
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        }
        catch {
            return null;
        }
    }
    return value;
}
function mapInterview(row) {
    return {
        id: row.id,
        publicId: row.public_id,
        guildId: row.guild_id,
        number: row.number,
        channelId: row.channel_id,
        creatorId: row.creator_id,
        targetUserId: row.target_user_id,
        modIds: row.mod_ids ?? [],
        status: row.status,
        openedAt: row.opened_at,
        closedAt: row.closed_at,
        closedBy: row.closed_by,
        transcriptHtml: row.transcript_html,
        transcriptData: parseTranscriptData(row.transcript_data),
        logMessageId: row.log_message_id,
    };
}
/**
 * Atomically claims the next interview-<number> for a guild. A single
 * UPSERT so two mods running /interview at the same instant can never be
 * handed the same number.
 */
export async function getNextInterviewNumber(guildId) {
    const { rows, } = await db.query(`
        INSERT INTO guild_interview_counters (
            guild_id,
            last_number
        )
        VALUES ($1, 1)
        ON CONFLICT (guild_id)
        DO UPDATE
        SET last_number = guild_interview_counters.last_number + 1
        RETURNING last_number
        `, [
        guildId,
    ]);
    return rows[0].last_number;
}
export async function createInterview(guildId, number, channelId, creatorId, targetUserId) {
    const publicId = randomUUID();
    const { rows, } = await db.query(`
        INSERT INTO interviews (
            public_id,
            guild_id,
            number,
            channel_id,
            creator_id,
            target_user_id
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `, [
        publicId,
        guildId,
        number,
        channelId,
        creatorId,
        targetUserId,
    ]);
    return mapInterview(rows[0]);
}
export async function getInterviewByChannelId(channelId) {
    const { rows, } = await db.query(`
        SELECT *
        FROM interviews
        WHERE channel_id = $1
        `, [
        channelId,
    ]);
    if (rows.length === 0) {
        return null;
    }
    return mapInterview(rows[0]);
}
export async function closeInterview(id, closedBy, modIds, transcriptData) {
    const { rows, } = await db.query(`
        UPDATE interviews
        SET
            status = 'closed',
            closed_at = now(),
            closed_by = $1,
            mod_ids = $2,
            transcript_data = $3
        WHERE id = $4
        RETURNING *
        `, [
        closedBy,
        modIds,
        JSON.stringify(transcriptData),
        id,
    ]);
    return mapInterview(rows[0]);
}
export async function setInterviewLogMessageId(id, logMessageId) {
    await db.query(`
        UPDATE interviews
        SET log_message_id = $1
        WHERE id = $2
        `, [
        logMessageId,
        id,
    ]);
}
