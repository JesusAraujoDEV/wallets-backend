const agendaService = require('../services/agenda_service');

async function forecast(req, res, next) {
  try {
    const items = await agendaService.getAgendaForecast(req.user.id);
    return res.json(items);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  forecast,
};
