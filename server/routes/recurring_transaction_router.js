const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth_handler');
const recurringTransactionCtrl = require('../controllers/recurring_transaction_controller');
const { validator } = require('../middlewares/validator');
const {
  createRecurringTransactionSchema,
  updateRecurringTransactionSchema,
  recurringTransactionIdParamSchema,
} = require('../schemas/recurring_transaction_schema');

router.use(protect);

router.post('/', validator(createRecurringTransactionSchema), recurringTransactionCtrl.create);
router.get('/', recurringTransactionCtrl.list);
router.post('/trigger', recurringTransactionCtrl.trigger);
router.patch('/:id', validator(recurringTransactionIdParamSchema, 'params'), validator(updateRecurringTransactionSchema), recurringTransactionCtrl.update);
router.delete('/:id', validator(recurringTransactionIdParamSchema, 'params'), recurringTransactionCtrl.remove);

module.exports = router;
