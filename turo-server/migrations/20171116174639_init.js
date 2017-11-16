console.log('yo??');

exports.up = function(knex, Promise) {
  console.log('are we running this dude?')
  return knex.schema.createTable('documents', function (table) {
    table.increments();
    table.text('text');
    table.string('title');
  }).then(result => {
    console.log('hello', result);
  })
  .catch(err => console.log(err));
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('documents');
};
