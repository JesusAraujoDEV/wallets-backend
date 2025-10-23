const db = require('../config/database');

const getAccountsByUserId = async (userId) => {
    const { rows } = await db.query('SELECT id, name, type, currency, balance, user_id AS "userId" FROM accounts WHERE user_id = $1 ORDER BY name', [userId]);
    return rows;
};

const createAccount = async (userId, { name, type = 'efectivo', currency, balance = 0 }) => {
    const { rows } = await db.query(
        'INSERT INTO accounts (name, type, currency, balance, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [name, type, currency, balance, userId]
    );
    return rows[0];
};

const updateAccount = async (accountId, userId, { name, currency }) => {
    const { rows } = await db.query(
        'UPDATE accounts SET name = $1, currency = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING id',
        [name, currency, accountId, userId]
    );
    return rows[0];
};

const deleteAccount = async (accountId, userId) => {
    // La FK en transactions tiene ON DELETE CASCADE, pero es mejor prevenir si hay lógica de negocio.
    // Por ahora, el controller maneja el error de FK.
    const result = await db.query('DELETE FROM accounts WHERE id = $1 AND user_id = $2', [accountId, userId]);
    return result;
};


module.exports = {
    getAccountsByUserId,
    createAccount,
    updateAccount,
    deleteAccount,
};
