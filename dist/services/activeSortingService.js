import { createEmptyScores, } from "../utils/sorting.js";
const activeSortings = new Map();
function getKey(guildId, userId) {
    return `${guildId}:${userId}`;
}
export function startSorting(guildId, userId, isResort = false) {
    const sorting = {
        guildId,
        userId,
        questionIndex: 0,
        scores: createEmptyScores(),
        startedAt: Date.now(),
        isResort,
    };
    activeSortings.set(getKey(guildId, userId), sorting);
    return sorting;
}
export function getActiveSorting(guildId, userId) {
    return (activeSortings.get(getKey(guildId, userId)) ?? null);
}
export function updateActiveSorting(sorting) {
    activeSortings.set(getKey(sorting.guildId, sorting.userId), sorting);
}
export function incrementQuestionIndex(guildId, userId) {
    const sorting = getActiveSorting(guildId, userId);
    if (!sorting) {
        return null;
    }
    sorting.questionIndex++;
    updateActiveSorting(sorting);
    return sorting;
}
export function removeActiveSorting(guildId, userId) {
    activeSortings.delete(getKey(guildId, userId));
}
export function hasActiveSorting(guildId, userId) {
    return activeSortings.has(getKey(guildId, userId));
}
export function clearExpiredSortings(maxAgeMs = 30 *
    60 *
    1000) {
    const now = Date.now();
    for (const [key, sorting,] of activeSortings.entries()) {
        if (now -
            sorting.startedAt >
            maxAgeMs) {
            activeSortings.delete(key);
        }
    }
}
export function getActiveSortingCount() {
    return activeSortings.size;
}
