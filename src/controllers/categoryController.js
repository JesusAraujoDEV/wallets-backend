const categoryService = require('../services/categoryService');

const getCategories = async (req, res) => {
    try {
        const categories = await categoryService.getCategoriesByUserId(req.user.id);
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const createCategory = async (req, res) => {
    try {
        const newCategory = await categoryService.createCategory(req.user.id, req.body);
        res.status(201).json({ ok: true, newId: newCategory.id });
    } catch (error)
     {
        if (error.code === '23505') { // unique_violation
             return res.status(409).json({ ok: false, message: 'Ya existe una categoría con ese nombre para este usuario y tipo.' });
        }
        res.status(500).json({ ok: false, message: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const updatedCategory = await categoryService.updateCategory(req.query.id, req.user.id, req.body);
        if (!updatedCategory) {
            return res.status(404).json({ ok: false, message: 'Categoría no encontrada o no pertenece al usuario.' });
        }
        res.status(200).json({ ok: true, message: 'Categoría actualizada' });
    } catch (error) {
         if (error.code === '23505') {
             return res.status(409).json({ ok: false, message: 'Ya existe otra categoría con ese nombre para este usuario y tipo.' });
        }
        res.status(500).json({ ok: false, message: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const result = await categoryService.deleteCategory(req.query.id, req.user.id);
        if (result.rowCount === 0) {
            return res.status(404).json({ ok: false, message: 'Categoría no encontrada o no pertenece al usuario.' });
        }
        res.status(200).json({ ok: true, message: 'Categoría eliminada' });
    } catch (error) {
        if (error.code === '23503') { // foreign key violation
            return res.status(400).json({ ok: false, message: 'No se puede eliminar la categoría porque tiene transacciones asociadas.' });
        }
        res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
};
