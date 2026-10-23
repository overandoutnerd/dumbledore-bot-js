import "dotenv/config";
import { Client, Pool } from "pg";
export const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
});
db.on("error", (error) => {
    console.error("[Database]", error.code, error.message);
});
const notificationHandlers = [];
export function onDbNotification(handler) {
    notificationHandlers.push(handler);
}
// LISTEN/NOTIFY requires a persistent session and does NOT work over Neon's
// pooled (PgBouncer transaction-mode) connection string - notifications get
// silently dropped since the session isn't held between statements. This
// client needs the DIRECT/unpooled connection string (no "-pooler" in the
// hostname). Falls back to DATABASE_URL so this doesn't crash if unset, but
// that fallback will NOT actually deliver notifications if DATABASE_URL is
// pooled - set DATABASE_URL_DIRECT.
const LISTEN_CONNECTION_STRING = process.env.DATABASE_URL_DIRECT ??
    process.env.DATABASE_URL;
if (!process.env.DATABASE_URL_DIRECT) {
    console.warn("[Database:listen] DATABASE_URL_DIRECT not set - falling back to " +
        "DATABASE_URL. If that's a pooled Neon connection string, " +
        "guild_settings_changed notifications will silently never arrive " +
        "and the settings cache will go stale after dashboard writes.");
}
async function connectListenClient() {
    const client = new Client({
        connectionString: LISTEN_CONNECTION_STRING,
        keepAlive: true,
    });
    client.on("notification", (msg) => {
        for (const handler of notificationHandlers) {
            handler(msg.channel, msg.payload);
        }
    });
    client.on("error", (error) => {
        console.error("[Database:listen]", error.code, error.message);
    });
    client.on("end", () => {
        console.warn("[Database:listen] connection closed, reconnecting in 5s...");
        setTimeout(reconnectListenClient, 5000);
    });
    try {
        await client.connect();
        await client.query("LISTEN guild_settings_changed");
        await client.query("LISTEN guild_bot_manager_roles_changed");
        console.log("[Database:listen] listening for guild_settings_changed, guild_bot_manager_roles_changed");
    }
    catch (error) {
        console.error("[Database:listen] failed to connect, retrying in 5s...", error);
        setTimeout(reconnectListenClient, 5000);
    }
}
function reconnectListenClient() {
    connectListenClient().catch((error) => {
        console.error("[Database:listen] reconnect failed:", error);
    });
}
connectListenClient();
