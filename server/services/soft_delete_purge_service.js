const cron = require('node-cron');
const { Op } = require('sequelize');
const { models } = require('../libs/sequelize');

const RETENTION_DAYS = 90;

// Purge order matters: children before parents, so no orphaned FK survives
// past the point where its soft-deleted parent is hard-deleted.
const PURGE_ORDER = [
  'RecurringTransaction',
  'Budget',
  'Debt',
  'Account',
  'Category',
  'CategoryGroup',
];

let purgeTask = null;

async function purgeSoftDeletedRecords(now = new Date()) {
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const summary = {};

  for (const modelName of PURGE_ORDER) {
    const model = models[modelName];
    const count = await model.destroy({
      where: { deletedAt: { [Op.lt]: cutoff } },
      force: true,
      paranoid: false,
    });
    summary[modelName] = count;
  }

  return summary;
}

function startSoftDeletePurgeCron() {
  if (purgeTask) return purgeTask;

  purgeTask = cron.schedule('30 0 * * *', async () => {
    try {
      const summary = await purgeSoftDeletedRecords();
      console.log('[SoftDeletePurge] Daily run complete:', summary);
    } catch (error) {
      console.error('[SoftDeletePurge] Daily run failed:', error.message);
    }
  });

  return purgeTask;
}

module.exports = { RETENTION_DAYS, purgeSoftDeletedRecords, startSoftDeletePurgeCron };
