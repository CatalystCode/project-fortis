const anonymousUser = 'anonymous@fortis';

function getUserFromArgs(...args) {
  return (args && args.length >= 2 && args[1].user && args[1].user.identifier) || anonymousUser;
}

module.exports = {
  getUserFromArgs
};
