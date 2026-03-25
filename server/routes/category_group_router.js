const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const categoryGroupCtrl = require('../controllers/category_group_controller');
const { validator } = require('../middlewares/validator');
const {
	createCategoryGroupSchema,
	updateCategoryGroupSchema,
	idParamSchema,
} = require('../schemas/category_group_schema');

router.use(protect);

router.get('/', categoryGroupCtrl.list);
router.post('/', validator(createCategoryGroupSchema), categoryGroupCtrl.create);
router.patch('/:id', validator(idParamSchema, 'params'), validator(updateCategoryGroupSchema), categoryGroupCtrl.update);
router.delete('/:id', validator(idParamSchema, 'params'), categoryGroupCtrl.remove);

module.exports = router;