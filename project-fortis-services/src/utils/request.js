function getUserFromArgs(...args) {
  return (args && args.length >= 2 && args[1].user && args[1].user.identifier) || '';
}

module.exports = {
  getUserFromArgs
};
