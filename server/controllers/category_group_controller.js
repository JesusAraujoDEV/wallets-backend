const categoryGroupService = require('../services/category_group_service');

async function list(req, res, next) {
  try {
    const items = await categoryGroupService.list(req.user.id);
    return res.json(items);
  } catch (e) { return next(e); }
}

module.exports = { list };