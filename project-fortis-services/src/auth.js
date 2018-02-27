const Promise = require('promise');
const passport = require('passport');
const OIDCBearerStrategy = require('passport-azure-ad').BearerStrategy;
const AnonymousStrategy = require('passport-anonymous').Strategy;
const NodeCache = require('node-cache');
const cassandraConnector = require('./clients/cassandra/CassandraConnector');
const { getUserFromArgs } = require('./utils/request');

const {
  adClientId, adLogLevel
} = require('../config').activeDirectory;

const MINUTES = 60;
const rolesCache = new NodeCache( { stdTTL: 5 * MINUTES } );

function initialize(app, route) {
  if (!adClientId) return console.warn('!!!!!!!!!!!! No Active Directory Client Id configured; auth is disabled !!!!!!!!!!!!');

  const adOptions = {
    identityMetadata: 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
    clientID: adClientId,
    validateIssuer: false,
    issuer: null,
    passReqToCallback: true,
    allowMultiAudiencesInToken: false,
    loggingLevel: adLogLevel
  };

  const bearerStrategy = new OIDCBearerStrategy(adOptions, (req, token, done) => {
    const user = { identifier: token.preferred_username };
    done(null, user, token);
  });

  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(bearerStrategy);
  passport.use(new AnonymousStrategy());
  app.use(route, passport.authenticate(['oauth-bearer', 'anonymous'], { session: false }));
}

function checkIfUserHasRole(user, role) {
  return new Promise((resolve, reject) => {
    const query = `
    SELECT identifier, role
    FROM settings.users
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
  if (!adClientId) return promiseFunc;

  function roleChecker(...args) {
    return new Promise((resolve, reject) => {
      const user = getUserFromArgs(...args);
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
