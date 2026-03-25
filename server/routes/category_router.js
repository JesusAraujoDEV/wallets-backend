const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const categoryCtrl = require('../controllers/category_controller');
const { validator } = require('../middlewares/validator');
const { createCategorySchema, updateCategorySchema, idQuerySchema } = require('../schemas/category_schema');

router.use(protect);

router.get('/', categoryCtrl.list);

router.post('/', validator(createCategorySchema), categoryCtrl.create);

router.patch('/', validator(idQuerySchema, 'query'), validator(updateCategorySchema), categoryCtrl.update);

router.delete('/', validator(idQuerySchema, 'query'), categoryCtrl.remove);

// Note: filtering is handled via GET / with query params groupId and type

module.exports = router;
