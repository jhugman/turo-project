import _ from 'lodash';

function UnitSchemeHelper () {
  this._table = {};
  this._noScheme = {};

  this._dimensionTable = {};
}

_.extend(UnitSchemeHelper.prototype, {

  addUnit (unit, additionalSchemes) {
    var self = this,
        unitSchemes = additionalSchemes || unit.getUnitSchemes();

    // e.g.
    // include "fundamental"
    // unit m (Scientific)

    var dimension = unit.getDimension(),
        dimensionName = dimension.shortName;

    if (dimensionName) {
      this._dimensionTable[dimensionName] = dimension;
    } else {
      var allDimensions = _.values(this._dimensionTable);
      for (var i=0, max=allDimensions.length; i<max; i++) {
        var d = allDimensions[i];
        if (d.isEqual(dimension)) {
          unit._dimension = d;
          break;
        }
      }
    }

    if (unitSchemes && unitSchemes.length) {
      _.each(unitSchemes, function (unitScheme) {
        var table = self._table[unitScheme] ||
                    (self._table[unitScheme] = {});
        self._addUnitToScheme(table, unit);
      });
    } else {
      self._addUnitToScheme(self._noScheme, unit);
    }

  },

  _addUnitToScheme (table, unit) {
    var dimension = unit.getDimension(),
        dimensionName = dimension.shortName,
        units;

    if (dimensionName) {
      units = table[dimensionName] ||
              (table[dimensionName] = []);
      units.push(unit);
    } else {
      console.log("WARN: " + unit.name + " isn't included in the keyboard: it has no named dimension");
    }

    delete this._keyboardCache;
  },

  getUnitSchemes () {

    if (!this._keyboardCache) {
      this._keyboardCache = {};
    }
    if (!this._keyboardCache.unitSchemes) {
      this._keyboardCache.unitSchemes = _.keys(this._table);
    }
    return this._keyboardCache.unitSchemes;
  },

  getDimensions (unitScheme) {
    var self = this;
    if (!this._keyboardCache) {
      this._keyboardCache = {};
    }
    var table = this._keyboardCache.unitSchemeDimensions;
    if (!table) {
      this._keyboardCache.unitSchemeDimensions = table = {};
    }
    if (!table[unitScheme]) {
      var dimensionNames = _.union(_.keys(this._table[unitScheme]), _.keys(this._noScheme));
      dimensionNames = _.sortBy(dimensionNames, function (dimensionName) {
        return self._dimensionTable[dimensionName].cardinality();
      });
      table[unitScheme] = dimensionNames;
    }
    return table[unitScheme];
  },

  getUnitNames (unitScheme, dimension) {
    if (!unitScheme) {
      return _.pluck(this._noScheme[dimension], "name");
    }

    if (!this._keyboardCache) {
      this._keyboardCache = {};
    }

    var table = this._keyboardCache.schemeDimensionUnitNames;
    if (!table) {
      this._keyboardCache.schemeDimensionUnitNames = table = {};
    }

    if (!table[unitScheme]) {
      table[unitScheme] = {};
    }

    table = table[unitScheme];
    if (!table[dimension]) {
      var units = (this._table[unitScheme] && this._table[unitScheme][dimension]);

      units = units || this._noScheme[dimension] || [];

      table[dimension] = _.pluck(units, "name");
    }

    return table[dimension];
  },

  findClosestUnit (srcUnit, unitScheme, dimensionName) {


    var abs = function (n) {
      return n > 0 ? n : -n;
    };

    this.getUnitNames(unitScheme, dimensionName);

    var closestUnit = srcUnit,
        closestDistanceToOne = 9999999,
        table = this._table[unitScheme][dimensionName],
        srcUnitName = srcUnit.name;

    _.each(table, function (unit) {
      var conv = unit._simpleUnitConverter(srcUnitName),
          distToOne = closestDistanceToOne;
      if (conv) {
        distToOne = abs(conv.value() - 1);
        if (distToOne < closestDistanceToOne) {
          closestDistanceToOne = distToOne;
          closestUnit = unit;
        }
      }
    });

    return closestUnit;
  }

});

export default {
  UnitSchemeHelper: UnitSchemeHelper
};