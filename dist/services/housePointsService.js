import { EmbedBuilder, } from "discord.js";
import { db, } from "./database.js";
import { EMBED_COLOR, } from "../config/constants.js";
import { getHouseCupLogChannel, } from "./guildSettingsService.js";
import { getHouseEmoji, } from "./houseConfigService.js";
import { getHouseDisplayName, } from "../utils/house.js";
function mapHousePoints(row) {
    return {
        guildId: row.guild_id,
        houseName: row.house_name,
        points: Number(row.points),
    };
}
export async function getHousePoints(guildId, houseName) {
    const { rows, } = await db.query(`
        SELECT
            points
        FROM house_points
        WHERE guild_id = $1
        AND house_name = $2
        `, [
        guildId,
        houseName,
    ]);
    if (rows.length === 0) {
        return 0;
    }
    return Number(rows[0].points);
}
export async function addHousePoints(guildId, houseName, points) {
    const currentPoints = await getHousePoints(guildId, houseName);
    // No floor at 0 - bonus points are a mod-controlled ledger (awards and
    // deductions), so it's allowed to go negative just like a real account
    // balance can. A deduction with no bonus points banked yet should still
    // register as a debt against the house rather than silently no-op at
    // zero, and that debt should show up in the House Cup total too (see
    // getHouseCupStandings in houseCupService.ts, which adds this straight
    // to averageXp with no clamp of its own).
    const newPoints = currentPoints +
        points;
    await db.query(`
        INSERT INTO house_points (
            guild_id,
            house_name,
            points
        )
        VALUES (
            $1,
            $2,
            $3
        )
        ON CONFLICT (
            guild_id,
            house_name
        )
        DO UPDATE SET
            points = EXCLUDED.points
        `, [
        guildId,
        houseName,
        newPoints,
    ]);
}
export async function setHousePoints(guildId, houseName, points) {
    // No floor at 0 here either - see addHousePoints above.
    await db.query(`
        INSERT INTO house_points (
            guild_id,
            house_name,
            points
        )
        VALUES (
            $1,
            $2,
            $3
        )
        ON CONFLICT (
            guild_id,
            house_name
        )
        DO UPDATE SET
            points = EXCLUDED.points
        `, [
        guildId,
        houseName,
        points,
    ]);
}
export async function getHouseLeaderboard(guildId) {
    const { rows, } = await db.query(`
        SELECT
            guild_id,
            house_name,
            points
        FROM house_points
        WHERE guild_id = $1
        ORDER BY
            points DESC,
            house_name ASC
        `, [
        guildId,
    ]);
    return rows.map(mapHousePoints);
}
export async function resetHousePoints(guildId) {
    await db.query(`
        DELETE FROM house_points
        WHERE guild_id = $1
        `, [
        guildId,
    ]);
}
/**
 * Posts a log entry to guild_settings.house_cup_log_channel_id (if
 * configured) recording a manual bonus-point award: who awarded it, to
 * which house, how much, and why. Mirrors the dashboard's
 * logHousePointsAward in houseCupService.js exactly, so an award looks
 * the same in the log channel regardless of whether it came from the
 * bot's /house-points command or the dashboard.
 */
export async function logHousePointsAward(guild, options) {
    const logChannelId = await getHouseCupLogChannel(guild.id);
    if (!logChannelId) {
        return;
    }
    try {
        const channel = await guild.channels.fetch(logChannelId);
        if (!channel ||
            !channel.isTextBased()) {
            return;
        }
        const emoji = await getHouseEmoji(guild.id, options.house);
        const sign = options.delta > 0
            ? "+"
            : "";
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle(`🏆 House Points ${options.delta >= 0 ? "Awarded" : "Deducted"}`)
            .addFields({
            name: "House",
            value: `${emoji} ${getHouseDisplayName(options.house)}`,
            inline: true,
        }, {
            name: "Points",
            value: `${sign}${options.delta} (now ${options.newTotal} bonus)`,
            inline: true,
        }, {
            name: "Moderator",
            value: `${options.moderator} (${options.moderator.username})`,
            inline: true,
        }, {
            name: "Reason",
            value: options.reason,
        })
            .setTimestamp();
        await channel.send({
            embeds: [
                embed,
            ],
        });
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ Failed to post House Cup log:", error);
    }
}
