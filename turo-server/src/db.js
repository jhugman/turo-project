const envName = 'development';
const config = require('../knexfile');
const knex = require('knex')(config[envName]);

const createDocument = ({ title, document }) =>
  knex('documents')
    .insert({ title, document })
    .returning('*');

const updateDocument = (id, { title, document }) =>
  knex('documents').where({ id })
    .update({ title, document })
    .returning('*');

const fetchDocument = id =>
  knex('documents').where({ id })
    .returning('*');

module.exports = {
  createDocument,
  updateDocument,
  fetchDocument,
};
