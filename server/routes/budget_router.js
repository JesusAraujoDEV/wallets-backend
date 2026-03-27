const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const { validator } = require('../middlewares/validator');
const budgetController = require('../controllers/budget_controller');
const {
  createBudgetSchema,
  listBudgetsQuerySchema,
  updateBudgetSchema,
  budgetIdParamSchema,
  budgetStatusQuerySchema,
} = require('../schemas/budget_schema');

router.use(protect);

router.post('/', validator(createBudgetSchema), budgetController.create);
router.get('/', validator(listBudgetsQuerySchema, 'query'), budgetController.list);
router.get('/status', validator(budgetStatusQuerySchema, 'query'), budgetController.status);
router.patch('/:id', validator(budgetIdParamSchema, 'params'), validator(updateBudgetSchema), budgetController.update);
router.delete('/:id', validator(budgetIdParamSchema, 'params'), budgetController.remove);

module.exports = router;