exports.up = function(knex, Promise) {
  return knex.schema.createTable('documents', function (table) {
    table.increments();
    table.text('document');
    table.string('title');
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('documents');
};
