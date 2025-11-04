const healthService = require('../services/health_service');

async function status(_req, res, next) {
  try {
    const payload = await healthService.getStatus();
    return res.json(payload);
  } catch (e) { return next(e); }
}

module.exports = { status };