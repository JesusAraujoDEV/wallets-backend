const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const txCtrl = require('../controllers/transaction_controller');
const { validator } = require('../middlewares/validator');
const {
	createTransactionSchema,
	transferSchema,
	confirmTransactionSchema,
} = require('../schemas/transaction_schema');

router.use(protect);
router.get('/', txCtrl.list);
router.get('/pending', txCtrl.pending);

router.post('/', validator(createTransactionSchema), txCtrl.create);

router.post('/transfer', validator(transferSchema), txCtrl.transfer);
router.patch('/:id/confirm', validator(confirmTransactionSchema), txCtrl.confirm);

router.patch('/', txCtrl.update);

router.delete('/', txCtrl.remove);

// Export transfers (GET for simple queries, POST for complex filters)
router.get('/transfer/export', txCtrl.exportTransfers);
router.post('/transfer/export', express.json(), txCtrl.exportTransfers);

// Export all transactions (PDF or XLSX) using server-side query
router.get('/export', txCtrl.exportAll);

module.exports = router;
