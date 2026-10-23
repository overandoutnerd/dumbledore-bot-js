import { db, } from "./database.js";
function mapOption(row) {
    return {
        id: row.id,
        categoryId: row.category_id,
        label: row.label,
        value: row.value,
        emoji: row.emoji,
        roleId: row.role_id,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
    };
}
export async function getOptions(categoryId) {
    const { rows, } = await db.query(`
        SELECT
            id,
            category_id,
            label,
            value,
            emoji,
            role_id,
            sort_order,
            created_at
        FROM category_options
        WHERE category_id = $1
        ORDER BY
            id ASC
        `, [
        categoryId,
    ]);
    return rows.map(mapOption);
}
export async function getOptionById(id) {
    const { rows, } = await db.query(`
        SELECT
            id,
            category_id,
            label,
            value,
            emoji,
            role_id,
            sort_order,
            created_at
        FROM category_options
        WHERE id = $1
        `, [
        id,
    ]);
    if (rows.length === 0) {
        return null;
    }
    return mapOption(rows[0]);
}
export async function getOptionByValue(categoryId, value) {
    const { rows, } = await db.query(`
        SELECT
            id,
            category_id,
            label,
            value,
            emoji,
            role_id,
            sort_order,
            created_at
        FROM category_options
        WHERE category_id = $1
        AND value = $2
        `, [
        categoryId,
        value,
    ]);
    if (rows.length === 0) {
        return null;
    }
    return mapOption(rows[0]);
}
export async function createOption(categoryId, label, value, emoji, roleId) {
    const { rows, } = await db.query(`
        INSERT INTO category_options (
            category_id,
            label,
            value,
            emoji,
            role_id
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5
        )
        RETURNING id
        `, [
        categoryId,
        label,
        value,
        emoji,
        roleId,
    ]);
    return rows[0].id;
}
export async function updateOption(id, label, value, emoji, roleId) {
    await db.query(`
        UPDATE category_options
        SET
            label = $1,
            value = $2,
            emoji = $3,
            role_id = $4
        WHERE id = $5
        `, [
        label,
        value,
        emoji,
        roleId,
        id,
    ]);
}
export async function updateOptionOrder(id, sortOrder) {
    await db.query(`
        UPDATE category_options
        SET
            sort_order = $1
        WHERE id = $2
        `, [
        sortOrder,
        id,
    ]);
}
export async function deleteOption(id) {
    await db.query(`
        DELETE FROM category_options
        WHERE id = $1
        `, [
        id,
    ]);
}
export async function deleteOptionsByCategory(categoryId) {
    await db.query(`
        DELETE FROM category_options
        WHERE category_id = $1
        `, [
        categoryId,
    ]);
}
export async function optionExists(categoryId, value) {
    const { rows, } = await db.query(`
        SELECT 1
        FROM category_options
        WHERE category_id = $1
        AND value = $2
        LIMIT 1
        `, [
        categoryId,
        value,
    ]);
    return (rows.length > 0);
}
export async function getRoleIdsForCategory(categoryId) {
    const { rows, } = await db.query(`
        SELECT
            role_id
        FROM category_options
        WHERE category_id = $1
        `, [
        categoryId,
    ]);
    return rows.map((row) => row.role_id);
}
