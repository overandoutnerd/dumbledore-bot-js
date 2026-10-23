const dashboards = new Map();
export function saveDashboard(guildId, channelId, messageId) {
    dashboards.set(guildId, {
        guildId,
        channelId,
        messageId,
        screen: "categories",
    });
}
export function getDashboard(guildId) {
    return dashboards.get(guildId);
}
export function updateDashboardState(guildId, data) {
    const dashboard = dashboards.get(guildId);
    if (!dashboard) {
        return;
    }
    dashboards.set(guildId, {
        ...dashboard,
        ...data,
    });
}
export function deleteDashboard(guildId) {
    dashboards.delete(guildId);
}
