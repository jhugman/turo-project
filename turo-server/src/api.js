const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');

const api = express.Router();
api.use(bodyParser.json());


api.get('/', (req, res) => res.send('Home!'));

api.post('/', (req, res) => {
  // insert model
  db.createDocument(req.body).then(doc => {
    res.json(doc[0]);
  }).catch(err => {
    res.status(500).json({ err });
  })
});

api.get('/:id', (req, res) => {
  db.fetchDocument(req.params.id)
  .then(doc => res.json(doc[0]))
  .catch(err => {
    console.log('yo', err);
    res.status(500).json({ err })
  });
});

api.put('/:id', (req, res) => {
  db.updateDocument(req.params.id, req.body).then(doc => {
    res.json(doc[0]);
  }).catch(err => {
    res.status(500).json({ err });
  });
});

module.exports = api;
