const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const accountCtrl = require('../controllers/account_controller');
const { validator } = require('../middlewares/validator');
const { createAccountSchema, updateAccountSchema, idQuerySchema } = require('../schemas/account_schema');

router.use(protect);

router.get('/', accountCtrl.list);

router.post('/', validator(createAccountSchema), accountCtrl.create);

router.patch('/', validator(idQuerySchema, 'query'), validator(updateAccountSchema), accountCtrl.update);

router.delete('/', validator(idQuerySchema, 'query'), accountCtrl.remove);

module.exports = router;
