const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const tagCtrl = require('../controllers/tag_controller');
const { validator } = require('../middlewares/validator');
const { createTagSchema, updateTagSchema, tagIdParamSchema, assignTagsSchema } = require('../schemas/tag_schema');

router.use(protect);

// CRUD tags
router.get('/', tagCtrl.list);
router.post('/', validator(createTagSchema), tagCtrl.create);
router.patch('/:id', validator(tagIdParamSchema, 'params'), validator(updateTagSchema), tagCtrl.update);
router.delete('/:id', validator(tagIdParamSchema, 'params'), tagCtrl.remove);

// Get transactions by tag
router.get('/:id/transactions', validator(tagIdParamSchema, 'params'), tagCtrl.getByTag);

// Assign/get tags for a specific transaction
router.put('/transaction/:transactionId', validator(assignTagsSchema), tagCtrl.assignTags);
router.get('/transaction/:transactionId', tagCtrl.getTransactionTags);

module.exports = router;
