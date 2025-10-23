const db = require('../config/database');
const axios = require('axios');
const { sequelize, Transaction: TxModel, Category: CategoryModel, Account: AccountModel } = require('../models');

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
        whereClauses.push(`t.category_id = $${paramIndex}`);
        params.push(parseInt(categoryId));
        paramIndex++;
    }
    if (accountId) {
        whereClauses.push(`t.account_id = $${paramIndex}`);
        params.push(parseInt(accountId));
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
    if (categoryId) { whereClauses.push(`t.category_id = $${paramIndex}`); params.push(parseInt(categoryId)); paramIndex++; }
    if (accountId) { whereClauses.push(`t.account_id = $${paramIndex}`); params.push(parseInt(accountId)); paramIndex++; }
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
        amountUsd = Number(amount) / Number(exchangeRateUsed);
    } else if (currency === 'USD') {
        amountUsd = amount;
    }

    return await sequelize.transaction(async (t) => {
        const category = await CategoryModel.findOne({ where: { id: categoryId, userId }, transaction: t });
        if (!category) throw new Error('Categoría no válida o no pertenece al usuario.');

        const categoryType = category.type; // 'ingreso' | 'gasto'
        const delta = categoryType === 'ingreso' ? amount : -amount;

    const account = await AccountModel.findOne({ where: { id: accountId, userId }, transaction: t });
        if (!account) throw new Error('Cuenta no válida o no pertenece al usuario.');
        const newBalance = Number(account.balance) + Number(delta);
        await account.update({ balance: newBalance }, { transaction: t });

        const created = await TxModel.create({
            description,
            amount,
            currency,
            amountUsd,
            exchangeRateUsed,
            date,
            categoryId,
            accountId,
            userId,
        }, { transaction: t });

        return { tx: {
            id: created.id,
            description: created.description,
            amount: created.amount,
            currency: created.currency,
            amountUsd: created.amountUsd,
            exchangeRateUsed: created.exchangeRateUsed,
            date: created.date,
            categoryId: created.categoryId,
            accountId: created.accountId,
            type: categoryType === 'ingreso' ? 'income' : 'expense',
        }};
    });
};

const updateTransaction = async (txId, userId, txData) => {
    const { description, amount, date, categoryId, accountId, currency } = txData;
    const categoryIdNum = categoryId != null ? parseInt(categoryId) : undefined;
    const accountIdNum = accountId != null ? parseInt(accountId) : undefined;

    return await sequelize.transaction(async (t) => {
        // Evitar locks para no provocar errores con joins
        const oldTx = await TxModel.findOne({ where: { id: txId, userId }, transaction: t });
        if (!oldTx) return null;

        // Determine new values (partial PATCH support)
        const newDescription = typeof description === 'string' ? description : oldTx.description;
        const newAmount = amount != null ? Number(amount) : Number(oldTx.amount);
        const newCurrency = typeof currency === 'string' ? currency : oldTx.currency;
        const newDate = date ? date : oldTx.date; // keep DATEONLY or string
        const newCategoryId = categoryIdNum != null ? categoryIdNum : oldTx.categoryId;
        const newAccountId = accountIdNum != null ? accountIdNum : oldTx.accountId;

        // Revert old balance
        const oldCategoryType = (await CategoryModel.findByPk(oldTx.categoryId, { transaction: t }))?.type;
        const oldDelta = oldCategoryType === 'ingreso' ? -Number(oldTx.amount) : Number(oldTx.amount);
    const oldAccount = await AccountModel.findOne({ where: { id: oldTx.accountId, userId }, transaction: t });
        if (oldAccount) await oldAccount.update({ balance: Number(oldAccount.balance) + oldDelta }, { transaction: t });

        // New category and account validations
        const newCategory = await CategoryModel.findOne({ where: { id: newCategoryId, userId }, transaction: t });
        if (!newCategory) throw new Error('Nueva categoría no es válida.');
        const newCategoryType = newCategory.type;

    const newAccount = await AccountModel.findOne({ where: { id: newAccountId, userId }, transaction: t });
        if (!newAccount) throw new Error('Cuenta no válida.');

        // Apply new balance
        const newDelta = newCategoryType === 'ingreso' ? Number(newAmount) : -Number(newAmount);
        await newAccount.update({ balance: Number(newAccount.balance) + newDelta }, { transaction: t });

        // Recalculate USD equivalence if needed
        let amountUsd = null;
        let exchangeRateUsed = null;
        if (newCurrency === 'VES') {
            exchangeRateUsed = await getVesPerUsdByDate(newDate);
            amountUsd = Number(newAmount) / Number(exchangeRateUsed);
        } else if (newCurrency === 'USD') {
            amountUsd = newAmount;
        }

        await oldTx.update({
            description: newDescription,
            amount: newAmount,
            currency: newCurrency,
            date: newDate,
            categoryId: newCategoryId,
            accountId: newAccountId,
            amountUsd,
            exchangeRateUsed,
        }, { transaction: t });

        return { tx: {
            id: oldTx.id,
            description: oldTx.description,
            amount: oldTx.amount,
            currency: oldTx.currency,
            date: oldTx.date,
            categoryId: oldTx.categoryId,
            accountId: oldTx.accountId,
            amountUsd: oldTx.amountUsd,
            exchangeRateUsed: oldTx.exchangeRateUsed,
            type: newCategoryType === 'ingreso' ? 'income' : 'expense',
        }};
    });
};

const deleteTransaction = async (txId, userId) => {
    return await sequelize.transaction(async (t) => {
        // Evitar locks para no provocar errores con joins
        const oldTx = await TxModel.findOne({ where: { id: txId, userId }, transaction: t });
        if (!oldTx) return { rowCount: 0 };

        const oldCategoryType = (await CategoryModel.findByPk(oldTx.categoryId, { transaction: t }))?.type;
        const oldDelta = oldCategoryType === 'ingreso' ? -Number(oldTx.amount) : Number(oldTx.amount);
        const account = await AccountModel.findOne({ where: { id: oldTx.accountId, userId }, transaction: t });
        if (account) await account.update({ balance: Number(account.balance) + oldDelta }, { transaction: t });

        await oldTx.destroy({ transaction: t });
        return { rowCount: 1 };
    });
};


module.exports = {
    getGroupedTransactions,
    getAllTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
};
