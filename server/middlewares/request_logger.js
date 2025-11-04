function requestLogger() {
  return function logger(req, res, next) {
    const { method, originalUrl } = req;
    console.log(`${method} ${originalUrl}`);

    const oldJson = res.json.bind(res);
    const oldSend = res.send.bind(res);
    let bodyCaptured;
    let capturedViaJson = false;

    res.json = function (body) {
      capturedViaJson = true;
      bodyCaptured = body;
      return oldJson(body);
    };

    res.send = function (body) {
      if (!capturedViaJson) {
        bodyCaptured = body;
      }
      return oldSend(body);
    };

    res.on('finish', () => {
      let out;
      try {
        if (bodyCaptured === undefined) {
          out = `<no-body> status=${res.statusCode}`;
        } else if (typeof bodyCaptured === 'string') {
          out = bodyCaptured;
        } else {
          out = JSON.stringify(bodyCaptured, null, 2);
        }
      } catch (e) {
        out = '<unserializable>';
      }
      console.log(`respuesta: ${out}`);
    });

    next();
  };
}

module.exports = { requestLogger };
