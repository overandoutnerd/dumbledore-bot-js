import { db, onDbNotification, } from "./database.js";
import { XP_PER_MESSAGE, XP_COOLDOWN_MS, HOUSE_POINT_VALUE, STAR_XP_VALUE, STARBOARD_THRESHOLD, MIN_XP_FOR_CONTRIBUTOR, BUMP_XP_VALUE, } from "../config/constants.js";
const HOUSE_COLUMN = {
    gryffindor: "gryffindor_role_id",
    ravenclaw: "ravenclaw_role_id",
    hufflepuff: "hufflepuff_role_id",
    slytherin: "slytherin_role_id",
};
const cache = new Map();
function defaultRow(guildId) {
    return {
        guild_id: guildId,
        logs_enabled: false,
        log_channel_id: null,
        welcome_enabled: false,
        welcome_channel_id: null,
        starboard_enabled: false,
        starboard_channel_id: null,
        azkaban_enabled: false,
        azkaban_role_id: null,
        sorting_hat_enabled: false,
        sorting_hat_channel_id: null,
        interviews_enabled: false,
        interview_log_channel_id: null,
        interview_category_id: null,
        bump_enabled: true,
        leveling_enabled: true,
        ai_response_enabled: false,
        ai_response_probability: 0,
        gryffindor_role_id: null,
        ravenclaw_role_id: null,
        hufflepuff_role_id: null,
        slytherin_role_id: null,
        xp_per_message: null,
        xp_cooldown_seconds: null,
        house_point_value: null,
        star_xp_value: null,
        starboard_threshold: null,
        min_xp_for_contributor: null,
        bump_xp_value: null,
        house_cup_channel_id: null,
        house_cup_log_channel_id: null,
    };
}
async function insertDefaultRow(guildId) {
    await db.query(`
        INSERT INTO guild_settings (
            guild_id
        )
        VALUES ($1)
        ON CONFLICT (guild_id)
        DO NOTHING
        `, [
        guildId,
    ]);
}
/**
 * Loads the full settings row for a guild, using the in-memory cache
 * whenever it's still fresh. This is the ONLY place that reads
 * guild_settings from Postgres - every getter below reads from the
 * cached row instead of issuing its own query.
 */
async function getRow(guildId) {
    const cached = cache.get(guildId);
    if (cached) {
        return cached.row;
    }
    const { rows, } = await db.query(`
        SELECT *
        FROM guild_settings
        WHERE guild_id = $1
        `, [
        guildId,
    ]);
    let row = rows[0];
    if (!row) {
        await insertDefaultRow(guildId);
        row = defaultRow(guildId);
    }
    cache.set(guildId, {
        row,
        fetchedAt: Date.now(),
    });
    return row;
}
// The trigger in schema.sql fires a NOTIFY for every write, including ones
// this same process just made via patchCache(). Without this, that NOTIFY
// would arrive a moment later and immediately evict the entry we just
// correctly patched, forcing a pointless re-fetch. So: remember, briefly,
// which guilds *we* just wrote, and ignore the echo for those.
const SELF_WRITE_GRACE_MS = 3_000;
const recentSelfWrites = new Map();
/** Patches the cached row in place after a successful write, so the very
 * next read in this process sees the new value immediately - no re-fetch,
 * no waiting on anything. */
function patchCache(guildId, patch) {
    const cached = cache.get(guildId);
    const row = {
        ...(cached?.row ??
            defaultRow(guildId)),
        ...patch,
    };
    cache.set(guildId, {
        row,
        fetchedAt: Date.now(),
    });
    recentSelfWrites.set(guildId, Date.now());
}
// Postgres tells us the instant a guild_settings row changes (trigger in
// schema.sql), whether we wrote it or the dashboard did. Unless it's the
// echo of our own recent write (see above), drop that guild's cached
// entry - the next getRow() call for it does one fresh query and caches
// the result again. This is the only thing that ever invalidates the
// cache; there is no timer.
onDbNotification((channel, payload) => {
    if (channel !== "guild_settings_changed" ||
        !payload) {
        return;
    }
    const selfWriteAt = recentSelfWrites.get(payload);
    if (selfWriteAt &&
        Date.now() - selfWriteAt <
            SELF_WRITE_GRACE_MS) {
        return;
    }
    cache.delete(payload);
});
/** Kept for backwards compatibility with anything that imports it directly;
 * every getter/setter below already ensures the row exists via getRow(). */
export async function createGuildSettings(guildId) {
    await getRow(guildId);
}
export async function setLogsEnabled(guildId, enabled) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET logs_enabled = $1
        WHERE guild_id = $2
        `, [
        enabled,
        guildId,
    ]);
    patchCache(guildId, {
        logs_enabled: enabled,
    });
}
export async function areLogsEnabled(guildId) {
    const row = await getRow(guildId);
    return row.logs_enabled;
}
export async function setLogChannel(guildId, channelId) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET log_channel_id = $1
        WHERE guild_id = $2
        `, [
        channelId,
        guildId,
    ]);
    patchCache(guildId, {
        log_channel_id: channelId,
    });
}
export async function getLogChannel(guildId) {
    const row = await getRow(guildId);
    return row.log_channel_id;
}
export async function setWelcomeEnabled(guildId, enabled) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET welcome_enabled = $1
        WHERE guild_id = $2
        `, [
        enabled,
        guildId,
    ]);
    patchCache(guildId, {
        welcome_enabled: enabled,
    });
}
export async function isWelcomeEnabled(guildId) {
    const row = await getRow(guildId);
    return row.welcome_enabled;
}
export async function setWelcomeChannel(guildId, channelId) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET welcome_channel_id = $1
        WHERE guild_id = $2
        `, [
        channelId,
        guildId,
    ]);
    patchCache(guildId, {
        welcome_channel_id: channelId,
    });
}
export async function getWelcomeChannel(guildId) {
    const row = await getRow(guildId);
    return row.welcome_channel_id;
}
export async function setStarboardEnabled(guildId, enabled) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET starboard_enabled = $1
        WHERE guild_id = $2
        `, [
        enabled,
        guildId,
    ]);
    patchCache(guildId, {
        starboard_enabled: enabled,
    });
}
export async function isStarboardEnabled(guildId) {
    const row = await getRow(guildId);
    return row.starboard_enabled;
}
export async function setStarboardChannel(guildId, channelId) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET starboard_channel_id = $1
        WHERE guild_id = $2
        `, [
        channelId,
        guildId,
    ]);
    patchCache(guildId, {
        starboard_channel_id: channelId,
    });
}
export async function getStarboardChannel(guildId) {
    const row = await getRow(guildId);
    return row.starboard_channel_id;
}
export async function setAzkabanEnabled(guildId, enabled) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET azkaban_enabled = $1
        WHERE guild_id = $2
        `, [
        enabled,
        guildId,
    ]);
    patchCache(guildId, {
        azkaban_enabled: enabled,
    });
}
export async function isAzkabanEnabled(guildId) {
    const row = await getRow(guildId);
    return row.azkaban_enabled;
}
export async function setAzkabanRole(guildId, roleId) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET azkaban_role_id = $1
        WHERE guild_id = $2
        `, [
        roleId,
        guildId,
    ]);
    patchCache(guildId, {
        azkaban_role_id: roleId,
    });
}
export async function getAzkabanRole(guildId) {
    const row = await getRow(guildId);
    return row.azkaban_role_id;
}
export async function setSortingHatEnabled(guildId, enabled) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET sorting_hat_enabled = $1
        WHERE guild_id = $2
        `, [
        enabled,
        guildId,
    ]);
    patchCache(guildId, {
        sorting_hat_enabled: enabled,
    });
}
export async function isSortingHatEnabled(guildId) {
    const row = await getRow(guildId);
    return row.sorting_hat_enabled;
}
export async function setSortingHatChannel(guildId, channelId) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET sorting_hat_channel_id = $1
        WHERE guild_id = $2
        `, [
        channelId,
        guildId,
    ]);
    patchCache(guildId, {
        sorting_hat_channel_id: channelId,
    });
}
export async function getSortingHatChannel(guildId) {
    const row = await getRow(guildId);
    return row.sorting_hat_channel_id;
}
export async function setInterviewsEnabled(guildId, enabled) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET interviews_enabled = $1
        WHERE guild_id = $2
        `, [
        enabled,
        guildId,
    ]);
    patchCache(guildId, {
        interviews_enabled: enabled,
    });
}
export async function areInterviewsEnabled(guildId) {
    const row = await getRow(guildId);
    return row.interviews_enabled;
}
export async function setInterviewLogChannel(guildId, channelId) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET interview_log_channel_id = $1
        WHERE guild_id = $2
        `, [
        channelId,
        guildId,
    ]);
    patchCache(guildId, {
        interview_log_channel_id: channelId,
    });
}
export async function getInterviewLogChannel(guildId) {
    const row = await getRow(guildId);
    return row.interview_log_channel_id;
}
export async function setInterviewCategory(guildId, categoryId) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET interview_category_id = $1
        WHERE guild_id = $2
        `, [
        categoryId,
        guildId,
    ]);
    patchCache(guildId, {
        interview_category_id: categoryId,
    });
}
export async function getInterviewCategory(guildId) {
    const row = await getRow(guildId);
    return row.interview_category_id;
}
export async function setBumpEnabled(guildId, enabled) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET bump_enabled = $1
        WHERE guild_id = $2
        `, [
        enabled,
        guildId,
    ]);
    patchCache(guildId, {
        bump_enabled: enabled,
    });
}
export async function isBumpEnabled(guildId) {
    const row = await getRow(guildId);
    return row.bump_enabled;
}
// Named for the underlying `leveling_enabled` column (see schema.sql) -
// this now gates House Cup XP gain as a whole (messages + star reactions),
// not a standalone leveling system.
export async function setHouseCupEnabled(guildId, enabled) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET leveling_enabled = $1
        WHERE guild_id = $2
        `, [
        enabled,
        guildId,
    ]);
    patchCache(guildId, {
        leveling_enabled: enabled,
    });
}
export async function isHouseCupEnabled(guildId) {
    const row = await getRow(guildId);
    return row.leveling_enabled;
}
// ai_response_enabled / ai_response_probability are dashboard-only settings
// (see database/schema.sql) - the bot only ever reads them here. The
// dashboard writes straight to guild_settings itself, which fires the same
// guild_settings_changed NOTIFY as every other setting, so the cache above
// picks up dashboard edits automatically; no setter is needed on this side.
export async function isAiResponseEnabled(guildId) {
    const row = await getRow(guildId);
    return row.ai_response_enabled;
}
export async function getAiResponseProbability(guildId) {
    const row = await getRow(guildId);
    return row.ai_response_probability;
}
export async function addModChannel(guildId, channelId) {
    await db.query(`
        INSERT INTO guild_mod_channels (
            guild_id,
            channel_id
        )
        VALUES ($1, $2)
        ON CONFLICT (guild_id, channel_id)
        DO NOTHING
        `, [
        guildId,
        channelId,
    ]);
}
export async function removeModChannel(guildId, channelId) {
    await db.query(`
        DELETE FROM guild_mod_channels
        WHERE guild_id = $1
          AND channel_id = $2
        `, [
        guildId,
        channelId,
    ]);
}
export async function getModChannelIds(guildId) {
    const { rows, } = await db.query(`
        SELECT
            channel_id
        FROM guild_mod_channels
        WHERE guild_id = $1
        `, [
        guildId,
    ]);
    return rows.map((row) => row.channel_id);
}
// ============================================================================
// Bot Manager roles (guild_bot_manager_roles table) - any number of roles
// per guild, cached separately from the main guild_settings row above
// since it lives in its own table with its own NOTIFY channel
// (guild_bot_manager_roles_changed, see schema.sql).
// ============================================================================
const botManagerRolesCache = new Map();
const RECENT_BOT_MANAGER_WRITE_GRACE_MS = 3_000;
const recentBotManagerRoleWrites = new Map();
async function fetchBotManagerRoleIds(guildId) {
    const { rows, } = await db.query(`
        SELECT role_id
        FROM guild_bot_manager_roles
        WHERE guild_id = $1
        ORDER BY role_id
        `, [
        guildId,
    ]);
    return rows.map((row) => row.role_id);
}
export async function getBotManagerRoleIds(guildId) {
    const cached = botManagerRolesCache.get(guildId);
    if (cached) {
        return cached;
    }
    const roleIds = await fetchBotManagerRoleIds(guildId);
    botManagerRolesCache.set(guildId, roleIds);
    return roleIds;
}
function markSelfWrite(guildId) {
    recentBotManagerRoleWrites.set(guildId, Date.now());
}
export async function addBotManagerRole(guildId, roleId) {
    await db.query(`
        INSERT INTO guild_bot_manager_roles (guild_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT (guild_id, role_id)
        DO NOTHING
        `, [
        guildId,
        roleId,
    ]);
    markSelfWrite(guildId);
    const current = await fetchBotManagerRoleIds(guildId);
    botManagerRolesCache.set(guildId, current);
}
export async function removeBotManagerRole(guildId, roleId) {
    await db.query(`
        DELETE FROM guild_bot_manager_roles
        WHERE guild_id = $1
          AND role_id = $2
        `, [
        guildId,
        roleId,
    ]);
    markSelfWrite(guildId);
    const current = await fetchBotManagerRoleIds(guildId);
    botManagerRolesCache.set(guildId, current);
}
/** Replaces the entire set of Bot Manager roles at once - used by the
 * /guild-settings role-select menu, which always reports its full
 * current selection rather than one added/removed role at a time. */
export async function setBotManagerRoleIds(guildId, roleIds) {
    const unique = [
        ...new Set(roleIds),
    ];
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        await client.query(`DELETE FROM guild_bot_manager_roles WHERE guild_id = $1`, [
            guildId,
        ]);
        for (const roleId of unique) {
            await client.query(`
                INSERT INTO guild_bot_manager_roles (guild_id, role_id)
                VALUES ($1, $2)
                ON CONFLICT (guild_id, role_id)
                DO NOTHING
                `, [
                guildId,
                roleId,
            ]);
        }
        await client.query("COMMIT");
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
    markSelfWrite(guildId);
    botManagerRolesCache.set(guildId, unique);
}
onDbNotification((channel, payload) => {
    if (channel !==
        "guild_bot_manager_roles_changed" ||
        !payload) {
        return;
    }
    const selfWriteAt = recentBotManagerRoleWrites.get(payload);
    if (selfWriteAt &&
        Date.now() - selfWriteAt <
            RECENT_BOT_MANAGER_WRITE_GRACE_MS) {
        return;
    }
    botManagerRolesCache.delete(payload);
});
export async function setHouseRoleId(guildId, house, roleId) {
    await insertDefaultRow(guildId);
    const column = HOUSE_COLUMN[house];
    await db.query(`
        UPDATE guild_settings
        SET ${column} = $1
        WHERE guild_id = $2
        `, [
        roleId,
        guildId,
    ]);
    patchCache(guildId, {
        [column]: roleId,
    });
}
export async function getHouseRoleId(guildId, house) {
    const row = await getRow(guildId);
    const column = HOUSE_COLUMN[house];
    return (row[column] ?? null);
}
export async function getAllHouseRoleIds(guildId) {
    const houses = [
        "gryffindor",
        "ravenclaw",
        "hufflepuff",
        "slytherin",
    ];
    const roleIds = await Promise.all(houses.map((house) => getHouseRoleId(guildId, house)));
    return roleIds.filter((roleId) => roleId !== null);
}
export async function setXpPerMessage(guildId, xpPerMessage) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET xp_per_message = $1
        WHERE guild_id = $2
        `, [
        xpPerMessage,
        guildId,
    ]);
    patchCache(guildId, {
        xp_per_message: xpPerMessage,
    });
}
export async function getXpPerMessage(guildId) {
    const row = await getRow(guildId);
    return (row.xp_per_message ??
        XP_PER_MESSAGE);
}
export async function setXpCooldownSeconds(guildId, seconds) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET xp_cooldown_seconds = $1
        WHERE guild_id = $2
        `, [
        seconds,
        guildId,
    ]);
    patchCache(guildId, {
        xp_cooldown_seconds: seconds,
    });
}
export async function getXpCooldownSeconds(guildId) {
    const row = await getRow(guildId);
    return (row.xp_cooldown_seconds ??
        Math.floor(XP_COOLDOWN_MS / 1000));
}
export async function setHousePointValue(guildId, value) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET house_point_value = $1
        WHERE guild_id = $2
        `, [
        value,
        guildId,
    ]);
    patchCache(guildId, {
        house_point_value: value,
    });
}
export async function getHousePointValue(guildId) {
    const row = await getRow(guildId);
    return (row.house_point_value ??
        HOUSE_POINT_VALUE);
}
export async function setStarXpValue(guildId, value) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET star_xp_value = $1
        WHERE guild_id = $2
        `, [
        value,
        guildId,
    ]);
    patchCache(guildId, {
        star_xp_value: value,
    });
}
export async function getStarXpValue(guildId) {
    const row = await getRow(guildId);
    return (row.star_xp_value ??
        STAR_XP_VALUE);
}
export async function setHouseCupChannel(guildId, channelId) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET house_cup_channel_id = $1
        WHERE guild_id = $2
        `, [
        channelId,
        guildId,
    ]);
    patchCache(guildId, {
        house_cup_channel_id: channelId,
    });
}
export async function getHouseCupChannel(guildId) {
    const row = await getRow(guildId);
    return row.house_cup_channel_id;
}
export async function setHouseCupLogChannel(guildId, channelId) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET house_cup_log_channel_id = $1
        WHERE guild_id = $2
        `, [
        channelId,
        guildId,
    ]);
    patchCache(guildId, {
        house_cup_log_channel_id: channelId,
    });
}
export async function getHouseCupLogChannel(guildId) {
    const row = await getRow(guildId);
    return row.house_cup_log_channel_id;
}
export async function setStarboardThreshold(guildId, threshold) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET starboard_threshold = $1
        WHERE guild_id = $2
        `, [
        threshold,
        guildId,
    ]);
    patchCache(guildId, {
        starboard_threshold: threshold,
    });
}
export async function getStarboardThreshold(guildId) {
    const row = await getRow(guildId);
    return (row.starboard_threshold ??
        STARBOARD_THRESHOLD);
}
export async function setMinXpForContributor(guildId, minXp) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET min_xp_for_contributor = $1
        WHERE guild_id = $2
        `, [
        minXp,
        guildId,
    ]);
    patchCache(guildId, {
        min_xp_for_contributor: minXp,
    });
}
/**
 * Minimum banked house XP a current house-role member needs before they
 * count as a "contributing member" for the House Cup average denominator.
 * See houseXpService.ts:getHouseContributorUserIds.
 */
export async function getMinXpForContributor(guildId) {
    const row = await getRow(guildId);
    return (row.min_xp_for_contributor ??
        MIN_XP_FOR_CONTRIBUTOR);
}
export async function setBumpXpValue(guildId, value) {
    await insertDefaultRow(guildId);
    await db.query(`
        UPDATE guild_settings
        SET bump_xp_value = $1
        WHERE guild_id = $2
        `, [
        value,
        guildId,
    ]);
    patchCache(guildId, {
        bump_xp_value: value,
    });
}
/** XP awarded to whoever ran a successful DISBOARD /bump. See bumpHandler.ts. */
export async function getBumpXpValue(guildId) {
    const row = await getRow(guildId);
    return (row.bump_xp_value ??
        BUMP_XP_VALUE);
}
export async function getGuildSettingsSummary(guildId) {
    const [row, botManagerRoleIds,] = await Promise.all([
        getRow(guildId),
        getBotManagerRoleIds(guildId),
    ]);
    return {
        botManagerRoleIds,
        gryffindorRoleId: row.gryffindor_role_id ??
            null,
        ravenclawRoleId: row.ravenclaw_role_id ??
            null,
        hufflepuffRoleId: row.hufflepuff_role_id ??
            null,
        slytherinRoleId: row.slytherin_role_id ??
            null,
        xpPerMessage: row.xp_per_message ??
            XP_PER_MESSAGE,
        xpCooldownSeconds: row.xp_cooldown_seconds ??
            Math.floor(XP_COOLDOWN_MS / 1000),
        housePointValue: row.house_point_value ??
            HOUSE_POINT_VALUE,
        starXpValue: row.star_xp_value ??
            STAR_XP_VALUE,
        starboardThreshold: row.starboard_threshold ??
            STARBOARD_THRESHOLD,
        minXpForContributor: row.min_xp_for_contributor ??
            MIN_XP_FOR_CONTRIBUTOR,
        bumpXpValue: row.bump_xp_value ??
            BUMP_XP_VALUE,
        houseCupChannelId: row.house_cup_channel_id,
        houseCupLogChannelId: row.house_cup_log_channel_id,
        aiResponseEnabled: row.ai_response_enabled,
        aiResponseProbability: row.ai_response_probability,
    };
}
