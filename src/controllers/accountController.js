const accountService = require('../services/accountService');

const getAccounts = async (req, res) => {
    try {
        const accounts = await accountService.getAccountsByUserId(req.user.id);
        res.status(200).json(accounts);
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const createAccount = async (req, res) => {
    try {
        const newAccount = await accountService.createAccount(req.user.id, req.body);
        res.status(201).json({ ok: true, newId: newAccount.id });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const updateAccount = async (req, res) => {
    try {
        const updatedAccount = await accountService.updateAccount(req.query.id, req.user.id, req.body);
        if (!updatedAccount) {
            return res.status(404).json({ ok: false, message: 'Cuenta no encontrada o no pertenece al usuario.' });
        }
        res.status(200).json({ ok: true, message: 'Cuenta actualizada' });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const result = await accountService.deleteAccount(req.query.id, req.user.id);
         if (result.rowCount === 0) {
            return res.status(404).json({ ok: false, message: 'Cuenta no encontrada o no pertenece al usuario.' });
        }
        res.status(200).json({ ok: true, message: 'Cuenta eliminada' });
    } catch (error) {
        if (error.code === '23503') { // foreign key violation
            return res.status(400).json({ ok: false, message: 'No se puede eliminar la cuenta porque tiene transacciones asociadas.' });
        }
        res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = {
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
};
