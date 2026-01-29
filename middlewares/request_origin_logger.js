function requestOriginLogger(req, res, next) {
  try {
    if (req.url.match(/\.(css|js|ico|png|jpg|jpeg|woff|woff2|svg|map)$/)) {
      next();
      return;
    }

    const origin = req.get('Origin') || req.get('Referer') || 'unknown';
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Ghost';
    const path = (req.originalUrl || req.url || '').replace(/^\/+/, '');

    console.log(`📡 [${req.method}] /${path}`);
    console.log(`   ↳ Desde: ${origin}`);
    console.log(`   ↳ IP: ${ip} | Agente: ${userAgent}`);
    console.log('------------------------------------------------');
  } catch (e) {
    console.error('Logger error', e?.message || e);
  }
  next();
}

module.exports = { requestOriginLogger };
