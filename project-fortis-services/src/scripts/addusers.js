#!/usr/bin/env node

'use strict';

const Promise = require('promise');
const cassandraConnector = require('../clients/cassandra/CassandraConnector');

function addUsers(role, users) {
  return new Promise((resolve, reject) => {
    if (!role || !role.length) return reject('role is not defined');
    if (!users || !users.length) return reject('users is not defined');

    const mutations = users.map(user => ({
      query: 'INSERT INTO fortis.users(identifier, role) VALUES (?, ?) IF NOT EXISTS',
      params: [user, role]
    }));

    Promise.all(mutations.map(mutation => cassandraConnector.executeBatchMutations([mutation])))
      .then(() => resolve({ numUsersAdded: mutations.length }))
      .catch(reject);
  });
}

function cli() {
  if (process.argv.length !== 4) {
    console.error(`Usage: ${process.argv[0]} ${process.argv[1]} <role> <user1>[,user2,user3]`);
    process.exit(1);
  }

  const role = process.argv[2];
  const users = process.argv[3].split(',');

  addUsers(role, users)
    .then(result => {
      console.log('Added new users');
      console.log(result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to add users');
      console.error(error);
      process.exit(1);
    });
}

cli();
