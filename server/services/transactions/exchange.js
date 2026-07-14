const axios = require('axios');

async function getVesPerUsdByDate(date) {
  const targetDate = date ? new Date(date) : new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(targetDate);
    d.setDate(d.getDate() - i);
    const dateString = d.toISOString().split('T')[0];
    try {
      const url = `https://bcv-api.irissoftware.lat/api/v1/exchange-rates?date=${dateString}`;
      const response = await axios.get(url, { headers: { 'accept': 'application/json' } });
      if (response.data && typeof response.data.usd_rate === 'number') {
        return response.data.usd_rate;
      }
    } catch (err) { /* ignore and continue */ }
  }
  return 150;
}

module.exports = { getVesPerUsdByDate };
