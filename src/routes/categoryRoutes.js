const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
    .get(getCategories)
    .post(createCategory);

router.route('/')
    .put(updateCategory)
    .delete(deleteCategory);

module.exports = router;
