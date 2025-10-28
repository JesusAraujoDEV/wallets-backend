const boom = require('@hapi/boom');

function validator(schema, property = 'body') {
  return (req, _res, next) => {
    const options = { abortEarly: false, stripUnknown: true, convert: true };
    const { error, value } = schema.validate(req[property], options);
    if (error) {
      const msg = error.details.map((d) => d.message).join(', ');
      return next(boom.badRequest(msg));
    }
    // assign sanitized value back
    req[property] = value;
    return next();
  };
}

module.exports = { validator };
