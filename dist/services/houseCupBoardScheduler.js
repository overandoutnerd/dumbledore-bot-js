import { isHouseCupEnabled, } from "./guildSettingsService.js";
import { getAllHouseCupBoardGuildIds, refreshHouseCupBoard, } from "./houseCupBoardService.js";
// House Cup XP changes constantly (every message, every star reaction),
// but editing the board message that often would spam Discord's rate
// limits for no real benefit. Instead the board is refreshed on this
// timer - "keep updating with the latest data" without hammering the API
// - plus once immediately whenever a mod manually awards bonus points
// (see the dashboard's /api/houses/:house/points route).
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
async function refreshAllBoards(client) {
    const guildIds = await getAllHouseCupBoardGuildIds();
    for (const guildId of guildIds) {
        try {
            if (!(await isHouseCupEnabled(guildId))) {
                continue;
            }
            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                continue;
            }
            await refreshHouseCupBoard(guild);
        }
        catch (error) {
            console.error(`[DumbledoreBot] ❌ House Cup board refresh failed for guild ${guildId}:`, error);
        }
    }
}
export function startHouseCupBoardScheduler(client) {
    console.log("[DumbledoreBot] 🏆 House Cup board scheduler started");
    setInterval(() => {
        void refreshAllBoards(client);
    }, REFRESH_INTERVAL_MS);
}
