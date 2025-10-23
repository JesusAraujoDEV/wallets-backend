const transactionService = require('../services/transactionService');

const getTransactions = async (req, res) => {
    const userId = req.user.id;
    const { grouped, pageSize, cursorDate, q, type, categoryId, accountId, date } = req.query;

    try {
        if (grouped === '1') {
            const result = await transactionService.getGroupedTransactions({
                userId,
                pageSize: parseInt(pageSize) || 20,
                cursorDate,
                q,
                type,
                categoryId,
                accountId,
                date
            });
            res.status(200).json(result);
        } else {
            const transactions = await transactionService.getAllTransactions({
                userId,
                q,
                type,
                categoryId,
                accountId,
                date
            });
            res.status(200).json(transactions);
        }
    } catch (error) {
        console.error('Error en /transactions:', error.message);
        res.status(500).json({ ok: false, message: 'Error del servidor al obtener transacciones.', error: error.message });
    }
};

const createTransaction = async (req, res) => {
    try {
        const result = await transactionService.createTransaction(req.user.id, req.body);
        res.status(201).json({ ok: true, newId: result.tx.id, tx: result.tx });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const updateTransaction = async (req, res) => {
    try {
        const id = parseInt(req.query.id, 10);
        if (!id || Number.isNaN(id)) {
            return res.status(400).json({ ok: false, message: 'Parámetro id inválido.' });
        }
        const result = await transactionService.updateTransaction(id, req.user.id, req.body);
        if (!result) {
            return res.status(404).json({ ok: false, message: 'Transacción no encontrada o no pertenece al usuario.' });
        }
        res.status(200).json({ ok: true, tx: result.tx, message: 'Transacción actualizada' });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const deleteTransaction = async (req, res) => {
    try {
        const result = await transactionService.deleteTransaction(req.query.id, req.user.id);
        if (result.rowCount === 0) {
            return res.status(404).json({ ok: false, message: 'Transacción no encontrada o no pertenece al usuario.' });
        }
        res.status(200).json({ ok: true });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};


module.exports = {
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
};
