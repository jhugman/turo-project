'use strict';

var _ = require('underscore');

var files = require('turo-docs');

var AbstractStorage = require('./abstract-storage');

function LocalFileStorage (basePath) {
  this.baseLocation = basePath;
  AbstractStorage.call(this);
}

LocalFileStorage.prototype = new AbstractStorage();

_.extend(LocalFileStorage.prototype, {

  saveDocument: function (doc, opts) {
    //
  },

  resolveLocation: function (id, baseLocation, callback) {
    var location = files.resolve(id, baseLocation || this.baseLocation);
    callback(location, this);
    return location;
  },

  loadString: function (location, callback) {
    if (!location) {
      callback('NO_DOCUMENT');
    }
    files.loadSource(location, callback);
  },
});

module.exports = LocalFileStorage;
