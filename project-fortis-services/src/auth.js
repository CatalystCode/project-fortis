const passport = require('passport');
const OIDCBearerStrategy = require('passport-azure-ad').BearerStrategy;

const {
  adClientId
} = require('../config').activeDirectory;

function initialize(app) {
  const adOptions = {
    identityMetadata: 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
    clientID: adClientId,
    validateIssuer: false,
    issuer: null,
    passReqToCallback: true,
    allowMultiAudiencesInToken: false,
    loggingLevel: 'info'
  };

  const bearerStrategy = new OIDCBearerStrategy(adOptions, (req, token, done) => {
    const user = {
      username: token.preferred_username
    };
    done(null, user, token);
  });

  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(bearerStrategy);
  app.use('/', passport.authenticate('oauth-bearer', { session: false }));
}

module.exports = {
  initialize
};
