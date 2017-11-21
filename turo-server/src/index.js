const express = require('express');
const api = require('./api');

const app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/api', api);

app.listen(3001, () => console.log('Example app listening on port 3001!'));
