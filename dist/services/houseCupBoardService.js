import { TextChannel, } from "discord.js";
import { db, } from "./database.js";
import { buildHouseCupComponents, buildHouseCupEmbed, buildHouseDetailEmbed, } from "./houseCupService.js";
export async function getHouseCupBoard(guildId) {
    const { rows, } = await db.query(`
        SELECT
            channel_id,
            message_id
        FROM house_cup_board
        WHERE guild_id = $1
        `, [
        guildId,
    ]);
    if (rows.length === 0) {
        return null;
    }
    return {
        guildId,
        channelId: rows[0].channel_id,
        messageId: rows[0].message_id,
    };
}
export async function setHouseCupBoard(guildId, channelId, messageId) {
    await db.query(`
        INSERT INTO house_cup_board (
            guild_id,
            channel_id,
            message_id,
            updated_at
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (guild_id)
        DO UPDATE SET
            channel_id = EXCLUDED.channel_id,
            message_id = EXCLUDED.message_id,
            updated_at = EXCLUDED.updated_at
        `, [
        guildId,
        channelId,
        messageId,
        Date.now(),
    ]);
}
export async function deleteHouseCupBoard(guildId) {
    await db.query(`DELETE FROM house_cup_board WHERE guild_id = $1`, [
        guildId,
    ]);
}
/** Every guild with a House Cup board configured - used by the scheduler. */
export async function getAllHouseCupBoardGuildIds() {
    const { rows, } = await db.query(`SELECT guild_id FROM house_cup_board`);
    return rows.map((row) => row.guild_id);
}
/**
 * Builds the {embeds, components} payload for one view of the board -
 * "home" (overall standings) or a specific house's detail view. Shared
 * by postHouseCupBoard/refreshHouseCupBoard (always the home view) and
 * the board's button handler (whichever view was clicked), so a button
 * click and a scheduled refresh always produce an identical-looking
 * message for the same view.
 */
export async function buildBoardView(guild, view) {
    const [embed, components,] = await Promise.all([
        view === "home"
            ? buildHouseCupEmbed(guild)
            : buildHouseDetailEmbed(guild, view),
        buildHouseCupComponents(guild.id, view),
    ]);
    return {
        embeds: [
            embed,
        ],
        components: [
            components,
        ],
    };
}
export async function postHouseCupBoard(guild, channel) {
    const payload = await buildBoardView(guild, "home");
    const message = await channel.send(payload);
    await setHouseCupBoard(guild.id, channel.id, message.id);
}
/**
 * Edits the existing House Cup board message in place with fresh
 * standings. Returns false (and clears the stored board row) if the
 * message or its channel no longer exists, so callers/the scheduler know
 * to stop trying until a mod runs /house-cup again.
 */
export async function refreshHouseCupBoard(guild) {
    const board = await getHouseCupBoard(guild.id);
    if (!board) {
        return false;
    }
    try {
        const channel = await guild.channels.fetch(board.channelId);
        if (!channel ||
            !(channel instanceof TextChannel)) {
            await deleteHouseCupBoard(guild.id);
            return false;
        }
        const message = await channel.messages.fetch(board.messageId);
        const payload = await buildBoardView(guild, "home");
        await message.edit(payload);
        await db.query(`UPDATE house_cup_board SET updated_at = $1 WHERE guild_id = $2`, [
            Date.now(),
            guild.id,
        ]);
        return true;
    }
    catch (error) {
        console.error(`[DumbledoreBot] ❌ Failed to refresh House Cup board for guild ${guild.id}:`, error);
        await deleteHouseCupBoard(guild.id);
        return false;
    }
}
