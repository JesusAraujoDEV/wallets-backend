const db = require('../config/database');

const getCategoriesByUserId = async (userId) => {
    const { rows } = await db.query(
        `SELECT id, name, type, icon, color, color_name AS "colorName", user_id AS "userId" 
         FROM categories 
         WHERE user_id = $1 
         ORDER BY type, name`,
        [userId]
    );
    return rows;
};

const createCategory = async (userId, { name, type, icon, color, colorName }) => {
    const { rows } = await db.query(
        'INSERT INTO categories (name, type, icon, color, color_name, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [name, type, icon, color, colorName, userId]
    );
    return rows[0];
};

const updateCategory = async (categoryId, userId, { name, type, icon, color, colorName }) => {
    const { rows } = await db.query(
        `UPDATE categories 
         SET name = $1, type = $2, icon = $3, color = $4, color_name = $5, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $6 AND user_id = $7 
         RETURNING id`,
        [name, type, icon, color, colorName, categoryId, userId]
    );
    return rows[0];
};

const deleteCategory = async (categoryId, userId) => {
    const result = await db.query('DELETE FROM categories WHERE id = $1 AND user_id = $2', [categoryId, userId]);
    return result;
};

module.exports = {
    getCategoriesByUserId,
    createCategory,
    updateCategory,
    deleteCategory,
};
