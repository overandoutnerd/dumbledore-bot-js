import { db, } from "./database.js";
import { HOUSE_GRYFFINDOR, HOUSE_HUFFLEPUFF, HOUSE_RAVENCLAW, HOUSE_SLYTHERIN, getDefaultHouseEmoji, } from "../utils/house.js";
const ALL_HOUSES = [
    HOUSE_GRYFFINDOR,
    HOUSE_RAVENCLAW,
    HOUSE_HUFFLEPUFF,
    HOUSE_SLYTHERIN,
];
async function getRow(guildId, house) {
    const { rows, } = await db.query(`
        SELECT
            channel_id,
            emoji
        FROM house_config
        WHERE guild_id = $1
        AND house_name = $2
        `, [
        guildId,
        house,
    ]);
    if (rows.length === 0) {
        return {
            channelId: null,
            emoji: null,
        };
    }
    return {
        channelId: rows[0].channel_id,
        emoji: rows[0].emoji,
    };
}
async function upsert(guildId, house, patch) {
    const current = await getRow(guildId, house);
    const next = {
        ...current,
        ...patch,
    };
    await db.query(`
        INSERT INTO house_config (
            guild_id,
            house_name,
            channel_id,
            emoji
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (guild_id, house_name)
        DO UPDATE SET
            channel_id = EXCLUDED.channel_id,
            emoji = EXCLUDED.emoji
        `, [
        guildId,
        house,
        next.channelId,
        next.emoji,
    ]);
}
export async function setHouseChannel(guildId, house, channelId) {
    await upsert(guildId, house, {
        channelId,
    });
}
export async function getHouseChannel(guildId, house) {
    const row = await getRow(guildId, house);
    return row.channelId;
}
export async function setHouseEmoji(guildId, house, emoji) {
    await upsert(guildId, house, {
        emoji,
    });
}
/**
 * The emoji to actually display for a house - a mod-configured custom or
 * standard emoji if one's been set from the dashboard, otherwise the
 * built-in default. Every embed/board/command that shows a house emoji
 * should go through this, not utils/house.ts:getDefaultHouseEmoji
 * directly, so "use custom house emojis everywhere" stays true even as
 * mods change them.
 */
export async function getHouseEmoji(guildId, house) {
    const row = await getRow(guildId, house);
    return (row.emoji ??
        getDefaultHouseEmoji(house));
}
export async function getAllHouseConfigs(guildId) {
    const { rows, } = await db.query(`
        SELECT
            house_name,
            channel_id,
            emoji
        FROM house_config
        WHERE guild_id = $1
        `, [
        guildId,
    ]);
    const byHouse = new Map(rows.map((row) => [
        row.house_name,
        {
            channelId: row.channel_id,
            emoji: row.emoji,
        },
    ]));
    const result = {};
    for (const house of ALL_HOUSES) {
        result[house] =
            byHouse.get(house) ?? {
                channelId: null,
                emoji: null,
            };
    }
    return result;
}
