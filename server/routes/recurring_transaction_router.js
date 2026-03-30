const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth_handler');
const recurringTransactionCtrl = require('../controllers/recurring_transaction_controller');
const { validator } = require('../middlewares/validator');
const {
  createRecurringTransactionSchema,
  updateRecurringTransactionSchema,
  recurringTransactionIdParamSchema,
  payNowSchema,
} = require('../schemas/recurring_transaction_schema');

router.use(protect);

// Static routes first
router.post('/', validator(createRecurringTransactionSchema), recurringTransactionCtrl.create);
router.get('/', recurringTransactionCtrl.list);
router.post('/trigger', recurringTransactionCtrl.trigger);

// Nested resource route before generic :id routes
router.post('/:id/pay-now', validator(recurringTransactionIdParamSchema, 'params'), validator(payNowSchema), recurringTransactionCtrl.payNow);

// Generic :id routes
router.patch('/:id', validator(recurringTransactionIdParamSchema, 'params'), validator(updateRecurringTransactionSchema), recurringTransactionCtrl.update);
router.delete('/:id', validator(recurringTransactionIdParamSchema, 'params'), recurringTransactionCtrl.remove);

module.exports = router;
