const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth_handler');
const { validator } = require('../middlewares/validator');
const agendaController = require('../controllers/agenda_controller');
const { agendaForecastQuerySchema } = require('../schemas/agenda_schema');

router.use(protect);
router.get('/forecast', validator(agendaForecastQuerySchema, 'query'), agendaController.forecast);

module.exports = router;
