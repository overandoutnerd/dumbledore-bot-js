import { randomUUID, } from "node:crypto";
const TTL_MS = 10 * 60 * 1000;
const pending = new Map();
function purgeExpired() {
    const now = Date.now();
    for (const [token, entry,] of pending) {
        if (entry.expiresAt <= now) {
            pending.delete(token);
        }
    }
}
export function createPendingOption(data) {
    purgeExpired();
    const token = randomUUID();
    pending.set(token, {
        data,
        expiresAt: Date.now() +
            TTL_MS,
    });
    return token;
}
export function getPendingOption(token, userId) {
    purgeExpired();
    const entry = pending.get(token);
    if (!entry ||
        entry.data.userId !==
            userId) {
        return null;
    }
    return entry.data;
}
export function deletePendingOption(token) {
    pending.delete(token);
}
