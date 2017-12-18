const Promise = require('promise');
const passport = require('passport');
const OIDCBearerStrategy = require('passport-azure-ad').BearerStrategy;
const NodeCache = require('node-cache');
const cassandraConnector = require('./clients/cassandra/CassandraConnector');

const {
  adClientId
} = require('../config').activeDirectory;

const MINUTES = 60;
const rolesCache = new NodeCache( { stdTTL: 5 * MINUTES } );

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
    const user = { identifier: token.preferred_username };
    done(null, user, token);
  });

  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(bearerStrategy);
  app.use('/', passport.authenticate('oauth-bearer', { session: false }));
}

function checkIfUserHasRole(user, role) {
  return new Promise((resolve, reject) => {
    const query = `
    SELECT identifier, role
    FROM fortis.users
    WHERE identifier = ?
    AND role = ?
    `.trim();

    const params = [
      user,
      role
    ];

    cassandraConnector.executeQuery(query, params)
      .then(rows => resolve(rows && rows.length === 1 && rows[0].role === role && rows[0].identifier === user))
      .catch(reject);
  });
}

const RoleOk = '1';
const RoleBad = '0';

function checkIfUserHasRoleCached(user, role) {
  return new Promise((resolve, reject) => {
    const cacheKey = `${user}_${role}`;

    const cachedRoleCheck = rolesCache.get(cacheKey);
    if (cachedRoleCheck === RoleOk) {
      return resolve(true);
    } else if (cachedRoleCheck === RoleBad) {
      return resolve(false);
    } else {
      return checkIfUserHasRole(user, role)
        .then(resolve)
        .catch(reject);
    }
  });
}

function requiresRole(promiseFunc, requiredRole) {
  function roleChecker(...args) {
    return new Promise((resolve, reject) => {
      const user = args && args.length >= 2 && args[1].user && args[1].user.identifier;
      if (!user) return reject('Unknown user');

      checkIfUserHasRoleCached(user, requiredRole)
        .then(hasRole => {
          if (!hasRole) return reject('Unknown user');
          return promiseFunc(...args)
            .then(resolve)
            .catch(reject);
        })
        .catch(reject);
    });
  }

  return roleChecker;
}

module.exports = {
  requiresRole,
  initialize
};
