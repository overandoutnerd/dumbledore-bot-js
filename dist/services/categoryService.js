import { db, } from "./database.js";
function mapCategory(row) {
    return {
        id: row.id,
        guildId: row.guild_id,
        name: row.name,
        title: row.title,
        description: row.description,
        emoji: row.emoji,
        selectionType: row.selection_type,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
    };
}
export async function getCategories(guildId) {
    const { rows, } = await db.query(`
        SELECT
            id,
            guild_id,
            name,
            title,
            description,
            emoji,
            selection_type,
            sort_order,
            created_at
        FROM categories
        WHERE guild_id = $1
        ORDER BY
            id ASC
        `, [
        guildId,
    ]);
    return rows.map(mapCategory);
}
export async function getCategoryById(id) {
    const { rows, } = await db.query(`
        SELECT
            id,
            guild_id,
            name,
            title,
            description,
            emoji,
            selection_type,
            sort_order,
            created_at
        FROM categories
        WHERE id = $1
        `, [
        id,
    ]);
    if (rows.length === 0) {
        return null;
    }
    return mapCategory(rows[0]);
}
export async function getCategoryByName(guildId, name) {
    const { rows, } = await db.query(`
        SELECT
            id,
            guild_id,
            name,
            title,
            description,
            emoji,
            selection_type,
            sort_order,
            created_at
        FROM categories
        WHERE guild_id = $1
        AND name = $2
        `, [
        guildId,
        name,
    ]);
    if (rows.length === 0) {
        return null;
    }
    return mapCategory(rows[0]);
}
export async function createCategory(guildId, name, title, description, emoji, selectionType = "single") {
    const { rows, } = await db.query(`
        INSERT INTO categories (
            guild_id,
            name,
            title,
            description,
            emoji,
            selection_type
        )
        VALUES (
            $1, $2, $3, $4, $5, $6
        )
        RETURNING id
        `, [
        guildId,
        name,
        title,
        description,
        emoji,
        selectionType,
    ]);
    return rows[0].id;
}
export async function updateCategory(id, title, description, emoji) {
    await db.query(`
        UPDATE categories
        SET
            title = $1,
            description = $2,
            emoji = $3
        WHERE id = $4
        `, [
        title,
        description,
        emoji,
        id,
    ]);
}
export async function updateCategoryOrder(id, sortOrder) {
    await db.query(`
        UPDATE categories
        SET
            sort_order = $1
        WHERE id = $2
        `, [
        sortOrder,
        id,
    ]);
}
export async function deleteCategory(id) {
    await db.query(`
        DELETE FROM categories
        WHERE id = $1
        `, [
        id,
    ]);
}
export async function categoryExists(guildId, name) {
    const { rows, } = await db.query(`
        SELECT 1
        FROM categories
        WHERE guild_id = $1
        AND name = $2
        LIMIT 1
        `, [
        guildId,
        name,
    ]);
    return (rows.length > 0);
}
