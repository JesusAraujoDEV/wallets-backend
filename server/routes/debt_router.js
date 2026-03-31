const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const { validator } = require('../middlewares/validator');
const debtController = require('../controllers/debt_controller');
const {
  createDebtSchema,
  updateDebtSchema,
  debtIdParamSchema,
  payDebtSchema,
  listDebtsQuerySchema,
  linkPastTransactionsSchema,
} = require('../schemas/debt_schema');

router.use(protect);

router.get('/', validator(listDebtsQuerySchema, 'query'), debtController.list);
router.post('/', validator(createDebtSchema), debtController.create);
router.patch('/:id', validator(debtIdParamSchema, 'params'), validator(updateDebtSchema), debtController.update);
router.delete('/:id', validator(debtIdParamSchema, 'params'), debtController.remove);
router.post('/:id/pay', validator(debtIdParamSchema, 'params'), validator(payDebtSchema), debtController.pay);
router.post('/:id/link-past-transactions', validator(debtIdParamSchema, 'params'), validator(linkPastTransactionsSchema), debtController.linkPastTransactions);

module.exports = router;
