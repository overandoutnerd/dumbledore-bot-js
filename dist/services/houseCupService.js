import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, } from "discord.js";
import { EMBED_COLOR, } from "../config/constants.js";
import { getHouseRoleId, getMinXpForContributor, } from "./guildSettingsService.js";
import { getHouseEmoji, } from "./houseConfigService.js";
import { getHousePoints, } from "./housePointsService.js";
import { getAllHouseXpTotals, getHouseContributorUserIds, getTopHouseContributors, } from "./houseXpService.js";
import { HOUSE_GRYFFINDOR, HOUSE_HUFFLEPUFF, HOUSE_RAVENCLAW, HOUSE_SLYTHERIN, getHouseDisplayName, } from "../utils/house.js";
const ALL_HOUSES = [
    HOUSE_GRYFFINDOR,
    HOUSE_RAVENCLAW,
    HOUSE_HUFFLEPUFF,
    HOUSE_SLYTHERIN,
];
export const HOUSE_CUP_HOME_BUTTON_ID = "housecup:home";
export function houseButtonId(house) {
    return `housecup:${house}`;
}
/**
 * Counts members currently holding a house's role. Relies on the guild's
 * member cache being warm (bot.ts backfills it on startup, and the
 * GuildMembers intent keeps it updated) - no network fetch here so this
 * stays cheap even for large servers.
 */
function countHouseMembers(guild, roleId) {
    if (!roleId) {
        return 0;
    }
    const role = guild.roles.cache.get(roleId);
    return role?.members.size ?? 0;
}
/**
 * Counts *current* house-role members who have also banked xp > 0 for
 * that house - i.e. members who have actually contributed, as opposed to
 * everyone currently holding the role. This is the denominator used for
 * the House Cup average so members who haven't earned any XP yet don't
 * drag the house's average down.
 */
function countContributingMembers(guild, roleId, contributorIds) {
    if (!roleId) {
        return 0;
    }
    const role = guild.roles.cache.get(roleId);
    if (!role) {
        return 0;
    }
    let count = 0;
    for (const [memberId,] of role.members) {
        if (contributorIds.has(memberId)) {
            count++;
        }
    }
    return count;
}
/**
 * House Cup standings: for each house, a member's average XP
 * (SUM of that house's banked XP / count of *current* house members who
 * have actually contributed at least `min_xp_for_contributor` XP - not
 * every current member), multiplied by 10 to turn it into a House Cup
 * "points" figure, plus any manual bonus points an admin has awarded from
 * the dashboard.
 *
 * A house with no contributing members has an average of 0 (its banked XP -
 * including any left behind by ex-members - still exists in house_xp, it
 * just isn't divided by anything meaningful until someone with enough xp
 * joins).
 */
export async function getHouseCupStandings(guild) {
    const minContributorXp = await getMinXpForContributor(guild.id);
    const [xpTotals, bonuses, contributorSets,] = await Promise.all([
        getAllHouseXpTotals(guild.id),
        Promise.all(ALL_HOUSES.map((house) => getHousePoints(guild.id, house))),
        Promise.all(ALL_HOUSES.map((house) => getHouseContributorUserIds(guild.id, house, minContributorXp))),
    ]);
    const roleIds = await Promise.all(ALL_HOUSES.map((house) => getHouseRoleId(guild.id, house)));
    return ALL_HOUSES.map((house, index) => {
        const totalXp = xpTotals[house];
        const memberCount = countHouseMembers(guild, roleIds[index]);
        const contributorCount = countContributingMembers(guild, roleIds[index], contributorSets[index]);
        const averageXp = contributorCount === 0
            ? 0
            : totalXp /
                (contributorCount *
                    10);
        const bonusPoints = bonuses[index];
        return {
            house,
            totalXp,
            memberCount,
            contributorCount,
            averageXp,
            bonusPoints,
            totalPoints: averageXp +
                bonusPoints,
        };
    });
}
function formatPoints(points) {
    return (Math.round(points * 10) / 10).toString();
}
/**
 * Fixed to GMT regardless of what timezone the bot process itself runs in,
 * so the footer always reads the same for every viewer (embed footer text
 * is static and can't use Discord's per-viewer <t:...> timestamp markup).
 */
function updatedFooterText() {
    const gmtTime = new Date().toLocaleString("en-US", {
        timeZone: "GMT",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
    return `Updated ${gmtTime} GMT`;
}
/**
 * Builds the House Cup standings embed (the "home" view of the board) -
 * shared by the /house-cup command (which posts/updates it in the
 * configured board channel), houseCupBoardScheduler.ts (which
 * periodically refreshes it in place), and the board's Home button, so
 * all three always render identically.
 */
export async function buildHouseCupEmbed(guild) {
    const standings = await getHouseCupStandings(guild);
    const sorted = [...standings].sort((first, second) => second.totalPoints -
        first.totalPoints);
    const leader = sorted[0];
    const emojis = Object.fromEntries(await Promise.all(ALL_HOUSES.map(async (house) => [
        house,
        await getHouseEmoji(guild.id, house),
    ])));
    const description = sorted
        .map((entry, index) => `${index + 1}. ${emojis[entry.house]} ${getHouseDisplayName(entry.house)} • ${formatPoints(entry.totalPoints)} pts` +
        ` (${entry.memberCount} member${entry.memberCount === 1 ? "" : "s"})`)
        .join("\n");
    return new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("🏆 House Cup Standings")
        .setDescription(description)
        .addFields({
        name: "Current Leader",
        value: `${emojis[leader.house]} ${getHouseDisplayName(leader.house)}`,
    })
        .setFooter({
        text: updatedFooterText(),
    });
}
/**
 * The per-house detail view shown when someone clicks that house's
 * button on the board: its points breakdown plus its top 5 XP
 * contributors (all-time, including anyone who's since switched houses -
 * see houseXpService.ts).
 */
export async function buildHouseDetailEmbed(guild, house) {
    const [standings, contributors, emoji,] = await Promise.all([
        getHouseCupStandings(guild),
        getTopHouseContributors(guild.id, house),
        getHouseEmoji(guild.id, house),
    ]);
    const entry = standings.find((s) => s.house === house);
    const contributorLines = contributors.length === 0
        ? "No one has earned XP for this house yet."
        : contributors
            .map((c, i) => `${i + 1}. <@${c.userId}> — ${c.xp} XP`)
            .join("\n");
    return new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(`${emoji} ${getHouseDisplayName(house)}`)
        .addFields({
        name: "Points",
        value: `${formatPoints(entry.totalPoints)} pts`,
        inline: true,
    }, {
        name: "Members",
        value: `${entry.memberCount}`,
        inline: true,
    }, {
        name: "Contributing",
        value: `${entry.contributorCount}`,
        inline: true,
    }, {
        name: "Top Contributors",
        value: contributorLines,
    })
        .setFooter({
        text: updatedFooterText(),
    });
}
/**
 * The Home + 4 house buttons on every House Cup board message. Emoji per
 * house comes from houseConfigService so custom emojis show up here too.
 * `activeView` gets a distinct (Success/green) style so it's visually
 * clear which view the board is currently showing, instead of Home
 * always looking selected regardless of what's actually displayed.
 */
export async function buildHouseCupComponents(guildId, activeView = "home") {
    const emojis = await Promise.all(ALL_HOUSES.map((house) => getHouseEmoji(guildId, house)));
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId(HOUSE_CUP_HOME_BUTTON_ID)
        .setLabel("Home")
        .setEmoji("🏠")
        .setStyle(activeView === "home"
        ? ButtonStyle.Success
        : ButtonStyle.Secondary));
    ALL_HOUSES.forEach((house, index) => {
        row.addComponents(new ButtonBuilder()
            .setCustomId(houseButtonId(house))
            .setLabel(getHouseDisplayName(house))
            .setEmoji(emojis[index])
            .setStyle(activeView === house
            ? ButtonStyle.Success
            : ButtonStyle.Secondary));
    });
    return row;
}
