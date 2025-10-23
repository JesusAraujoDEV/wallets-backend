const db = require('../config/database');
const axios = require('axios');

// Helper para obtener la tasa de cambio
const getVesPerUsdByDate = async (date) => {
    // Fallback a hoy si no hay fecha
    const targetDate = date ? new Date(date) : new Date();
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(targetDate);
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        
        try {
            const response = await axios.get(`https://api.dolarvzla.com/public/exchange-rate/list?from=${dateString}&to=${dateString}`);
            if (response.data && response.data.rates && response.data.rates.length > 0 && response.data.rates[0].usd) {
                return response.data.rates[0].usd;
            }
        } catch (error) {
            console.error(`No se pudo obtener la tasa para ${dateString}:`, error.message);
        }
    }
    // Fallback a una tasa genérica si la API falla por 7 días
    return 150; 
};


const getGroupedTransactions = async (filters) => {
    const { userId, pageSize = 20, cursorDate, q, type, categoryId, accountId, date } = filters;
    
    const params = [userId, pageSize];
    let paramIndex = 3;
    let whereClauses = ['t.user_id = $1'];

    if (q) {
        whereClauses.push(`(t.description ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex})`);
        params.push(`%${q}%`);
        paramIndex++;
    }
    if (type) {
        whereClauses.push(`c.type = $${paramIndex}`);
        params.push(type === 'income' ? 'ingreso' : 'gasto');
        paramIndex++;
    }
    if (categoryId) {
        whereClauses.push(`t.category_id::text = $${paramIndex}`);
        params.push(categoryId);
        paramIndex++;
    }
    if (accountId) {
        whereClauses.push(`t.account_id::text = $${paramIndex}`);
        params.push(accountId);
        paramIndex++;
    }
    if (date) {
        whereClauses.push(`t.date::date = $${paramIndex}`);
        params.push(date);
        paramIndex++;
    }
    if (cursorDate) {
        whereClauses.push(`t.date::date < $${paramIndex}`);
        params.push(cursorDate);
        paramIndex++;
    }

    const whereSql = whereClauses.join(' AND ');

    const query = `
        WITH RankedDays AS (
            SELECT 
                t.date::date as day,
                COUNT(*) as tx_count,
                SUM(COUNT(*)) OVER (ORDER BY t.date::date DESC) as cumulative_tx
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE ${whereSql}
            GROUP BY t.date::date
        ),
        DaysToFetch AS (
            SELECT day
            FROM RankedDays
            WHERE cumulative_tx - tx_count < $2
        )
        SELECT 
            t.id,
            t.description,
            t.amount,
            t.currency,
            t.amount_usd AS "amountUsd",
            t.exchange_rate_used AS "exchangeRateUsed",
            t.date,
            t.category_id AS "categoryId",
            t.account_id AS "accountId",
            c.type AS type
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.date::date IN (SELECT day FROM DaysToFetch) AND t.user_id = $1
        ORDER BY t.date DESC, t.id DESC;
    `;

    const { rows: items } = await db.query(query, params);

    let nextCursorDate = null;
    if (items.length > 0) {
        const lastDate = items[items.length - 1].date;
        const checkMoreQuery = `SELECT 1 FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE ${whereSql.replace(`$${paramIndex-1}`, '$3')} AND t.date::date < $4 LIMIT 1`;
        const checkParams = cursorDate ? params.slice(0, -1) : [...params];
        checkParams.push(lastDate);
        
        const { rows: moreRows } = await db.query(checkMoreQuery, [userId, pageSize, ...checkParams.slice(2)]);
        if (moreRows.length > 0) {
            nextCursorDate = new Date(lastDate).toISOString().split('T')[0];
        }
    }

    return {
        items,
        hasMore: nextCursorDate !== null,
        nextCursorDate,
    };
};

const getAllTransactions = async (filters) => {
    // Implementación para el modo legacy
    const { userId, q, type, categoryId, accountId, date } = filters;
    let whereClauses = ['t.user_id = $1'];
    const params = [userId];
    let paramIndex = 2;

     if (q) { whereClauses.push(`(t.description ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex})`); params.push(`%${q}%`); paramIndex++; }
    if (type) { whereClauses.push(`c.type = $${paramIndex}`); params.push(type === 'income' ? 'ingreso' : 'gasto'); paramIndex++; }
    if (categoryId) { whereClauses.push(`t.category_id::text = $${paramIndex}`); params.push(categoryId); paramIndex++; }
    if (accountId) { whereClauses.push(`t.account_id::text = $${paramIndex}`); params.push(accountId); paramIndex++; }
    if (date) { whereClauses.push(`t.date::date = $${paramIndex}`); params.push(date); paramIndex++; }

    const query = `
        SELECT t.*, c.type as type FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY t.date DESC, t.id DESC
    `;
    const { rows } = await db.query(query, params);
    return rows;
};


const createTransaction = async (userId, txData) => {
    const { description, amount, currency, date, categoryId, accountId } = txData;

    let amountUsd = null;
    let exchangeRateUsed = null;

    if (currency === 'VES') {
        exchangeRateUsed = await getVesPerUsdByDate(date);
        amountUsd = amount / exchangeRateUsed;
    } else if (currency === 'USD') {
        amountUsd = amount;
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const { rows: categoryRows } = await client.query('SELECT type FROM categories WHERE id = $1 AND user_id = $2', [categoryId, userId]);
        if (categoryRows.length === 0) throw new Error('Categoría no válida o no pertenece al usuario.');
        const categoryType = categoryRows[0].type;

        const delta = categoryType === 'ingreso' ? amount : -amount;
        await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3', [delta, accountId, userId]);

        const { rows: txRows } = await client.query(
            `INSERT INTO transactions (description, amount, currency, amount_usd, exchange_rate_used, date, category_id, account_id, user_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id, description, amount, currency, amount_usd AS "amountUsd", exchange_rate_used AS "exchangeRateUsed", date, category_id AS "categoryId", account_id AS "accountId"`,
            [description, amount, currency, amountUsd, exchangeRateUsed, date, categoryId, accountId, userId]
        );
        
        const newTx = { ...txRows[0], type: categoryType === 'ingreso' ? 'income' : 'expense' };

        await client.query('COMMIT');
        return { tx: newTx };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

const updateTransaction = async (txId, userId, txData) => {
    const { description, amount, date, categoryId, accountId, currency } = txData;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const { rows: oldTxRows } = await client.query(
            `SELECT t.*, c.type as old_category_type FROM transactions t
             JOIN categories c ON t.category_id = c.id
             WHERE t.id = $1 AND t.user_id = $2`,
            [txId, userId]
        );
        if (oldTxRows.length === 0) return null;
        const oldTx = oldTxRows[0];

        // Revert old balance
        const oldDelta = oldTx.old_category_type === 'ingreso' ? -oldTx.amount : oldTx.amount;
        await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3', [oldDelta, oldTx.account_id, userId]);

        // Apply new balance
        const { rows: newCategoryRows } = await client.query('SELECT type FROM categories WHERE id = $1 AND user_id = $2', [categoryId, userId]);
        if (newCategoryRows.length === 0) throw new Error('Nueva categoría no es válida.');
        const newCategoryType = newCategoryRows[0].type;
        
        const newDelta = newCategoryType === 'ingreso' ? amount : -amount;
        await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3', [newDelta, accountId, userId]);

        let amountUsd = null;
        let exchangeRateUsed = null;
        if (currency === 'VES') {
            exchangeRateUsed = await getVesPerUsdByDate(date);
            amountUsd = amount / exchangeRateUsed;
        } else if (currency === 'USD') {
            amountUsd = amount;
        }

        const { rows: updatedTxRows } = await client.query(
            `UPDATE transactions SET
                description = $1, amount = $2, currency = $3, date = $4, category_id = $5, account_id = $6,
                amount_usd = $7, exchange_rate_used = $8, updated_at = CURRENT_TIMESTAMP
             WHERE id = $9 AND user_id = $10
             RETURNING id, description, amount, currency, amount_usd AS "amountUsd", exchange_rate_used AS "exchangeRateUsed", date, category_id AS "categoryId", account_id AS "accountId"`,
            [description, amount, currency, date, categoryId, accountId, amountUsd, exchangeRateUsed, txId, userId]
        );

        const updatedTx = { ...updatedTxRows[0], type: newCategoryType === 'ingreso' ? 'income' : 'expense' };

        await client.query('COMMIT');
        return { tx: updatedTx };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

const deleteTransaction = async (txId, userId) => {
     const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const { rows: oldTxRows } = await client.query(
            `SELECT t.*, c.type as old_category_type FROM transactions t
             JOIN categories c ON t.category_id = c.id
             WHERE t.id = $1 AND t.user_id = $2`,
            [txId, userId]
        );
        if (oldTxRows.length === 0) {
            await client.query('ROLLBACK');
            return { rowCount: 0 };
        }
        const oldTx = oldTxRows[0];

        // Revert balance
        const oldDelta = oldTx.old_category_type === 'ingreso' ? -oldTx.amount : oldTx.amount;
        await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3', [oldDelta, oldTx.account_id, userId]);

        const result = await client.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [txId, userId]);
        
        await client.query('COMMIT');
        return result;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};


module.exports = {
    getGroupedTransactions,
    getAllTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
};
