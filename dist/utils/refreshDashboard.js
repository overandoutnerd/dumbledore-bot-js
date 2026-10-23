import { getDashboard, } from "../services/adminDashboardService.js";
import { buildAdminDashboard, } from "./adminDashboard.js";
import { buildCategoryDashboard, } from "./categoryDashboard.js";
export async function refreshAdminDashboard(client, guildId) {
    const dashboard = getDashboard(guildId);
    if (!dashboard) {
        return;
    }
    try {
        const channel = await client.channels.fetch(dashboard.channelId);
        if (!channel ||
            !channel.isTextBased()) {
            return;
        }
        const message = await channel.messages.fetch(dashboard.messageId);
        if (dashboard.screen ===
            "options") {
            if (!dashboard.selectedCategoryId) {
                return;
            }
            await message.edit(await buildCategoryDashboard(dashboard.selectedCategoryId, dashboard.selectedOptionId));
            return;
        }
        await message.edit(await buildAdminDashboard(guildId, dashboard.selectedCategoryId));
    }
    catch (error) {
        console.error("[DumbledoreBot] Failed to refresh dashboard:", error);
    }
}
