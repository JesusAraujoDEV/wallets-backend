const db = require('../config/database');
const transactionService = require('./transactionService');

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

const updateAccount = async (accountId, userId, payload) => {
    // Obtener cuenta actual
    const { rows: existingRows } = await db.query(
        'SELECT id, name, type, currency, balance FROM accounts WHERE id = $1 AND user_id = $2',
        [accountId, userId]
    );
    if (existingRows.length === 0) return null;
    const current = existingRows[0];

    // Actualizar name/currency si vienen en el payload (PATCH parcial)
    const fields = [];
    const params = [];
    let p = 1;
    if (typeof payload.name === 'string') { fields.push(`name = $${p++}`); params.push(payload.name); }
    if (typeof payload.currency === 'string') { fields.push(`currency = $${p++}`); params.push(payload.currency); }

    if (fields.length > 0) {
        params.push(accountId, userId);
        await db.query(
            `UPDATE accounts SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${p++} AND user_id = $${p} RETURNING id`,
            params
        );
    }

    // Si viene balance, crear transacción de ajuste en vez de setear balance directo
    if (payload.balance !== undefined && payload.balance !== null && payload.balance !== '') {
        const newBalance = Number(payload.balance);
        const delta = newBalance - Number(current.balance);
        if (delta !== 0) {
            // Asegurar categoría de ajuste según signo del delta
            const adjType = delta > 0 ? 'ingreso' : 'gasto';
            let categoryId;
            const { rows: catRows } = await db.query(
                'SELECT id FROM categories WHERE user_id = $1 AND name = $2 AND type = $3 LIMIT 1',
                [userId, 'Ajuste de Balance', adjType]
            );
            if (catRows.length > 0) {
                categoryId = catRows[0].id;
            } else {
                const { rows: newCat } = await db.query(
                    'INSERT INTO categories (name, type, user_id, icon, color, color_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                    ['Ajuste de Balance', adjType, userId, 'Scale', '#888888', 'Gray']
                );
                categoryId = newCat[0].id;
            }

            // Usar la moneda actualizada si se envió, si no la actual
            const currencyToUse = typeof payload.currency === 'string' ? payload.currency : current.currency;

            // Crear transacción de ajuste usando el servicio de transacciones (esto actualiza el balance)
            await transactionService.createTransaction(userId, {
                description: 'Ajuste de Balance',
                amount: Math.abs(delta),
                currency: currencyToUse,
                date: new Date().toISOString().split('T')[0],
                categoryId,
                accountId,
            });
        }
    }

    return { id: accountId };
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
