const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { models } = require('../libs/sequelize');

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(new JwtStrategy(options, async (payload, done) => {
  try {
    const user = await models.User.findByPk(payload.id, {
      attributes: ['id', 'username', 'email', 'name'],
    });
    if (!user) return done(null, false);
    return done(null, user.toJSON());
  } catch (err) {
    return done(err, false);
  }
}));

module.exports = passport;
