import _ from 'underscore';
import Dimension from './Dimension';
import Multiple from './Multiple';

// XXX this should not be here.
import ast from '../ast';

/**
 * A series of objects that will build up to units
 */


/**
 * Some untility methods to build Unit
 */

/**
 * Takes:
 * * a list of unitnames,
 * * map of { unitname: dimensionality }
 * * a plan object: {top: [ list of single units ]}
 *
 * e.g. { m: 2, cm: -1 }, empty_plan
 * returns:
 * {
 *    top   : [ m. m ],
 *    bottom: [ cm ]
 * }
 */
function planConversions(map, plan) {
  plan = plan || {
    top: [],
    bottom: []
  };
 _.each(map, function (i, unitName) {
   var dimensionality = map[unitName],
       pI;
   if (dimensionality < 0) {
     for (pI = dimensionality; pI < 0; pI++) {
       plan.bottom.push(unitName);
     }
   } else if (dimensionality > 0) {
     for (pI = 0; pI < dimensionality; pI++) {
       plan.top.push(unitName);
     }
   }
   return plan;
 });
 return plan;
}

/**
 * A combination of simple units, into a single object. e.g. miles per hour. This should be able to
 * provide a conversion to other units of the equivalent dimensionality.
 */
export default class CompoundUnit {
  constructor(table, constituentUnits, dimension) {
    if (_.isString(constituentUnits)) {
      this.name = constituentUnits;
    } else {
      this.simpleUnits = constituentUnits;
    }
    if (dimension) {
      this._dimension = dimension;
    }
    this.unitsTable = table;
  }

  getDimension () {
    if (this._dimension) {
      return this._dimension;
    }
    var self = this,
        dimension = {};

    _.each(self.simpleUnits, function (i, key) {
      var scalar = self.simpleUnits[key],
          unit = self.unitsTable.getUnit(key),
          myDimension = unit.getDimension().dimensions;

      _.each(myDimension, function (j, dimName) {
        var currentValue = dimension[dimName] || 0;
        currentValue += scalar * myDimension[dimName];
        dimension[dimName] = currentValue;
      });
    });
    this._removeZeroDimensions(dimension);
    this._isDimensionless = !!_.isEmpty(dimension);
    this._dimension = new Dimension(dimension);
    return this._dimension;
  }

  // schemes should be mutable.
  // addUnitScheme("imperial")
  // if scheme is currently _mixed, then it should be replaced
  getUnitSchemes () {

    if (this._unitSchemes_user) {
      return this._unitSchemes_user;
    }

    if (this._unitSchemes) {
      return this._unitSchemes;
    }


    this._unitSchemes = (function (self) {
      var unitsTable = self.unitsTable,
          myUnitSchemes = [];

      if (self.baseUnit) {
        return self.baseUnit.getUnitSchemes();
      }
      _.each(self.simpleUnits, function (i, key) {
        var unit = unitsTable.getUnit(key),
            unitSchemes;

        if (myUnitSchemes) {
          myUnitSchemes = unit.getUnitSchemes();
        } else {
          // this should allow the same unit with different
          // schemes, e.g. metric and si.
          unitSchemes = unit.getUnitSchemes();

          // units without schemes shouldn't make a difference
          // e.g. km / h => metric
          // case "_mixed":
          // case []: no scheme, e.g. hour
          // case [unitname]
          if (unitSchemes === "_mixed" || myUnitSchemes === "_mixed") {
            myUnitSchemes = "_mixed";
          } else if (_.isEmpty(unitSchemes) || _.isEmpty(myUnitSchemes)) {
            myUnitSchemes = _.isEmpty(unitSchemes) ? myUnitSchemes : unitSchemes;
          } else {
            myUnitSchemes = _.intersection(myUnitSchemes, unitSchemes);
            if (_.isEmpty(myUnitSchemes)) {
              myUnitSchemes = "_mixed";
            }
          }
        }
      });

      var userSchemes = self._unitSchemes_user;
      if (userSchemes) {
        if (myUnitSchemes === "_mixed") {
          myUnitSchemes = userSchemes;
        } else {
          myUnitSchemes = _.union(myUnitSchemes, userSchemes);
        }
      }
      return myUnitSchemes;
    })(this);

    return this._unitSchemes;
  }

  addUnitScheme (label) {
    var userSchemes = this._unitSchemes_user;
    if (!userSchemes) {
      userSchemes = this._unitSchemes_user = [ label ];
    } else {
      userSchemes.push(label);
    }
    // we'll blow away the cache this._unitSchemes later.
    // there's no point blowing away just us,
    // because we don't know what else is going to happen.
  }

  isDimensionless () {
    if (typeof this._isDimensionless === 'undefined') {
      this.getDimension();
    }
    return this._isDimensionless;
  }

  getSimpleUnits () {
    if (this.simpleUnits) {
      return this.simpleUnits;
    } else if (this.name) {
      if (this._simpleUnits) {
        return this._simpleUnits;
      }
      var compound = {};
      compound[this.name] = 1;
      this._simpleUnits = compound;
      return compound;
    }
  }

  matchesDimensions (destinationUnit) {
    return this.getDimension().isEqual(destinationUnit.getDimension());
  }

  cardinality () {
    if (this._cardinality) {
      return this._cardinality;
    }
    if (this.name) {
      this._cardinality = 1;
    } else if (this.simpleUnits) {
      var u = this.simpleUnits;
      this._cardinality = _.reduce(u, function (memo, i, key) {
        var value = u[key];
        value = value > 0 ? value : -value;
        return memo + value;
      }, 0);
    }
    return this._cardinality;
  }

  refactoredNode (quantity, unitScheme, useSimpleUnitsOnly) {
    var candidates = this._reductions(unitScheme, useSimpleUnitsOnly),
        // this is a rubbish algorithhm for choosing which candidate to move to.
        newUnit = candidates[0];

    if (candidates.length === 0) {
      throw new Error("Cannot factor unit into anything sensible");
    }

    if (typeof quantity === 'number') {
      quantity = new Multiple(quantity, 1);
    } else if (!quantity) {
      quantity = Multiple.one();
    } else {
      console.log('Quantity is ' + typeof(quantity) + ': ' + quantity);
    }

    var multiplier = this._convert(quantity, newUnit);

    return {
      multiplier: multiplier,
      value: multiplier.value(),
      unit: newUnit
    };
  }

  _reductions = (function () {


    // From a list of units, filter the ones that will be useful to us
    // to factor the reducingUnit.
    function findCompoundUnits (allUnits, reducingUnit, unitScheme) {
      var list = [],
          unitDimension = reducingUnit.getDimension();
      _.each(allUnits, function (i, unitName) {
          var unit = allUnits[unitName],
              dimension = unit.getDimension();
          // only compound ones needed
          if (dimension.cardinality() <= 1) {
            return;
          }
          if (unitDimension.contains(dimension)) {
            // we're only interested in units that can reduce the reducingUnit

            // TODO: consider unit schemes.
            if (!unitScheme || _.indexOf(unit.getUnitSchemes(), unitScheme) >= 0) {
              list.push(unit);
            }

          }
      });

      list = _.sortBy(list, function (unit) {
        return unit.cardinality();
      });

      return list;
    }

    // complete is a unit that is refactored.
    // result is a the result object.
    // Add complete iff it has a lower cardinality (i.e. expresses the dimension in the fewest possible units)
    // that the current best.
    function considerBest (result, complete) {
      var best = result.bestCardinality,
          cardinality = complete.cardinality();

      if (best < cardinality) {
        return;
      } else if (best === cardinality) {
        var i = 0, max = result.matches.length;
        for (; i < max; i++) {
          // check we haven't got a duplicate
          if (result.matches[i].isEqual(complete)) {
            return;
          }
        }
        result.matches.push(complete);
      } else {
        result.bestCardinality = cardinality;
        result.matches = [complete];
      }
    }

    // Translate this compound unit in to the target unitScheme,
    // unit - which is guaranteed to contain only simple named units.
    // unitScheme - the unitScheme passed to the refactoredNode method.
    function translateToUnitScheme (unit, unitScheme) {
      var unitTable = unit.unitsTable,
          unitSchemes = unitTable.unitSchemes,
          simpleUnits = unit.getSimpleUnits(),
          newSimpleUnits = {};
      _.each(simpleUnits, function (i, key) {
        var partUnit = unitTable.getUnit(key),
            dimensionName = partUnit.getDimension().shortName,
            newPartUnit;

        if (!dimensionName) {
          throw new Error("Trying to translate " + partUnit.name + " into " + unitScheme + " but it's not simple");
        }

        newPartUnit = unitSchemes.findClosestUnit(partUnit, unitScheme, dimensionName);

        newSimpleUnits[newPartUnit.name] = simpleUnits[key];

      });

      return new CompoundUnit(unitTable, newSimpleUnits);
    }

    /*
     * reducingUnit - the remaining unit needed to be factored.
     * currentBigUnits - the list of unconsidered named compound units.
     * accumulator - a candidate result unit. i.e. reducingUnit * accumulator = paritally factored initial reducingUnit
     * test - the named compound unit we have just tested to see if it is contained in the reducing unit.
     * result - the list of complete accumulator units.
     */
    function findReductions (reducingUnit, currentBigUnits, unitScheme, accumulator, test, result) {
      result = result || {
        bestCardinality: 9999999,
        matches: []
      };

      accumulator = accumulator || new CompoundUnit(reducingUnit.unitsTable, {});

      // we should assume that reducing unit is simple;

      if (test) {
        // if test completely matches reducing unit, then our job is done.
        if (test.matchesDimensions(reducingUnit)) {
          // We have constructed an accumulator out of named compound units only.
          considerBest(result, accumulator.by(test));
          return result;
        }

        if (!reducingUnit.getDimension().contains(test.getDimension())) {
          // We can't reduce the unit with the test unit, so
          // remove it from the pool.
          currentBigUnits = _.reject(currentBigUnits, function (un) {
            return un === test;
          });
        } else {
          // We can reduce the unit with the test unit, so replace the
          // accumulator with a new one.
          accumulator = accumulator.by(test);

          // this is how many units we've accumulated already (the 1 is test)
          var currentCardinality = accumulator.cardinality();

          // If we gave up now, our cardinality would be be
          // increased by the total dimension cardinality of what's left.
          // maximumCardinality = currentCardinality + (reducingUnit.getDimension().cardinality() - test.getDimension().cardinality());

          // optimisation, though it's unlikely to do anything in all but
          // the most complicated units.
          if (currentCardinality > result.bestCardinality) {
            return result;
          }

          // TODO how can this be made less heavy weight?
          reducingUnit = reducingUnit.per(test)._simplifiedNode().unit;

          // maximumCardinality is not very useful, but we can calculate it here as:
          // maximumCardinality = currentCardinality + reducingUnit.getDimension().cardinality();
        }
      }


      // We've run out of named compound units to test.
      // We only have named simple units left.
      if (currentBigUnits.length === 0) {
        // Translate the remaining simple units into unit scheme
        // appropriate units.
        if (unitScheme) {
          reducingUnit = translateToUnitScheme(reducingUnit, unitScheme);
        }
        considerBest(result, accumulator.by(reducingUnit));
        return result;
      }


      _.each(currentBigUnits, function (next) {
        // recurse if we haven't seen this before, except if we've just looked at it.
        if (test === next || !accumulator.simpleUnits[next.name]) {
          findReductions(reducingUnit, currentBigUnits, unitScheme, accumulator, next, result);
        }

      });

      return result;
    }


    return function _reductions (unitScheme, simpleUnitsOnly) {
      var simplified = this.simplify(),
          list,
          reduced;

      if (simpleUnitsOnly) {
        list = [];
      } else {
        list = findCompoundUnits(this.unitsTable.units, simplified.unit, unitScheme);
      }

      if (list.length) {
        reduced = findReductions(simplified.unit, list, unitScheme);
        return reduced.matches.length ? reduced.matches : [this];
      } else {
        if (unitScheme) {
          return [translateToUnitScheme(simplified.unit, unitScheme)];
        } else {
          return [this];
        }
      }
    };
  })()

  _convertSimpleUnit (quantity, destinationUnit) {
    if (this.multiples && destinationUnit.name) {
      var mult = this._simpleUnitConverter(destinationUnit.name);
      return quantity._times(mult);
    } else {
      throw new Error("Cannot convert from " + this.name + " to " + destinationUnit.name);
    }
  }

  _simpleUnitConverter (destinationUnitName) {
    return this.multiples[destinationUnitName];
  }

  convert (quantity, destinationUnit) {
    return this._convert(Multiple.quantity(quantity), destinationUnit).value();
  }

  _convert (quantity, destinationUnit) {
    var self = this,
        mult;
    if (_.isString(destinationUnit)) {
      destinationUnit = this.unitsTable.getUnit(destinationUnit);
    }
    if (!this.matchesDimensions(destinationUnit)) {
      throw new Error("CANNOT CONVERT - DIMENSION MISMATCH");
    }

    if (this === destinationUnit) {
      return quantity;
    }

    // TODO javascript numbers

    // check if this is a named unit.
    if (this.multiples && destinationUnit.multiples) {
      mult = this._simpleUnitConverter(destinationUnit.name);
      // Bug fix: litre => gallon. (litre and gallon are defined in terms of different units)
      // Better fix: calculate new ratio, then add & cross fertilize multiples so we don't have to go the long way round
      // next time.
      if (mult) {
        return quantity._times(mult);
      }
    }

    // first we need to get a map of { dimensionName: { unitName: dimensionInt }}
    // this will help us make a list of conversions, on a dimension by dimension basis.
    var srcNode = this._convertToDimensionDimensionalityMap(),
        dstNode = destinationUnit._convertToDimensionDimensionalityMap();

    var srcDimensionalityMap = srcNode.map,
        dstDimensionalityMap = dstNode.map;

    // 1 kg / month * year in kg
    // 1 kg / month in kg/year
    function balancePlans (srcPlan, destPlan) {
      if (srcPlan.top.length && srcPlan.bottom.length) {
        destPlan.top.push(srcPlan.bottom);
        srcPlan.bottom = [];
      }
      if (destPlan.top.length && destPlan.bottom.length) {
        srcPlan.top.push(destPlan.bottom);
        destPlan.bottom = [];
      }
    }

    // for each dimension, make a list of pairs of simple units to convert between.
    // top and bottoms are used to reduced the error that we'll be introducing from crappy
    // arithmetic.
    // km/h/s => m/s^2
    // src: { top: [km], bottom: [h, s] },
    // dst: { top: [m],  bottom: [s, s] },
    var srcPlan = {top: [], bottom: []},
        dstPlan = {top: [], bottom: []};

    _.each(srcDimensionalityMap, function (i, dimensionName) {
      var srcUnitMap = srcDimensionalityMap[dimensionName],
          dstUnitMap = dstDimensionalityMap[dimensionName];


      var _srcPlan = {top: [], bottom: []},
          _dstPlan = {top: [], bottom: []};


      planConversions(srcUnitMap, _srcPlan);
      planConversions(dstUnitMap, _dstPlan);

      balancePlans(_srcPlan, _dstPlan);

      // XXX horrible conversion between a single pair of conversion plans and multiple ones
      srcPlan.top.push(_srcPlan.top);
      srcPlan.bottom.push(_srcPlan.bottom);
      dstPlan.top.push(_dstPlan.top);
      dstPlan.bottom.push(_dstPlan.bottom);
    });


    function simpleConversion (product, srcList, dstList) {
      // we're going to make the assumption that all units in the same dimension are
      // in the same direction (i.e. all +ve or all -ve);
      // The by product of this assumption is that we can assume that srcList and destList
      // are same length;
      srcList = _.flatten(srcList);
      dstList = _.flatten(dstList);
      if (srcList.length !== dstList.length) {
        throw new Error("UNEXPECTED_UNIT_CONVERSION_PROBLEMS");
      }
      // TODO javascript numbers used here.
      for (var j=0, max=srcList.length; j<max; j++) {
        if (srcList[j] !== dstList[j]) {
          var srcUnit = self.unitsTable.getUnit(srcList[j]),
              dstUnit = self.unitsTable.getUnit(dstList[j]);
          product = srcUnit._convertSimpleUnit(product, dstUnit);
        }
      }
      return product;
    }

    var product = simpleConversion(quantity, srcPlan.top, dstPlan.top).
                  divide(simpleConversion(Multiple.one(), srcPlan.bottom, dstPlan.bottom));

    // TODO this is a javascript number.
    var result = product.
            _times(srcNode.multiplier).
            _divide(dstNode.multiplier);
    return result;
  }

  /**
   * Unpacks a unit into its simplest constituent parts, and buckets them into
   * dimensions.
   *
   * Part of the conversion is to lookup unit statements such as
   *  unit kph : 1000 km/h
   *
   * The `1000` is collected in the return value's (aka the node's) `multiple`
   * property.
   *
   * return {
   *  map: { length: {mi: 1}, time: { s: -1, h: -1 } }
   *  multiplier: Multiple
   *  simplified: {}
   * }
   *
   * Simple example of map:
   *
   *   m^3 s^2 => { length: { m: 3 }, time: { s: 2 }};
   *
   * Will recursively discover dimensions from compound units:
   *
   *   mph/s => { length: {mi: 1}, time: { s: -1, h: -1 } }
   *
   *
   * `simplified`: gives the maximal expansion of units, with the union
   * of single dimension units in this unit, and the expansion of base units.
   *
   *    mph/s => { mi: 1, h: -1, h: -1 }
   */
  _convertToDimensionDimensionalityMap (node, dimensionMultiplier) {
    var currentMap, multiplier;

    node = node || {
      map: {},
      // TODO javascript number is used.
      multiplier: new Multiple(),
      simplified: {},
      namedCompoundUnits: []
    };

    currentMap = node.map;
    dimensionMultiplier = dimensionMultiplier || 1;
    multiplier = node.multiplier;

    var self = this,
        dimensionObj = self.getDimension(),
        dimensions = dimensionObj.dimensions,
        simpleUnits;

    if (dimensionObj.isSimple() && self.name) {
      // not sure if we need to check self.name;
      var dimension = dimensionObj.shortName;

      var currentUnitMap = currentMap[dimension] || (currentMap[dimension] = {}),
          currentValue = currentUnitMap[self.name] || 0,
          // We are using a javascript number here.
          // TODO check assumption we never actually do the calculation here.
          // TODO consider complex number dimensions / javascript number
          newValue = currentValue + dimensions[dimension] * dimensionMultiplier;

      currentUnitMap[self.name] = newValue;
      node.simplified[self.name] = newValue;
      return node;
    }

    if (self.baseUnit) {
      node.namedCompoundUnits.push(self.name);
      node.multiplier = node.multiplier._times(self.baseMultiple);
      return self.baseUnit._convertToDimensionDimensionalityMap(node, dimensionMultiplier);
    }

    simpleUnits = self.getSimpleUnits();


    _.each(self.simpleUnits, function (i, unitName) {
      var dimensionality = simpleUnits[unitName],
          subUnit = self.unitsTable.getUnit(unitName);

      subUnit._convertToDimensionDimensionalityMap(node, dimensionality * dimensionMultiplier);
    });
    return node;
  }

  isEqual (other) {
    return _.isEqual(this.getSimpleUnits(), other.getSimpleUnits());
  }

  // TODO rename to simplified
  // This will take an arbitrarily complicate unit and return a
  // minimal compount unit composed soley
  // of simple units.
  // Units of the same dimension are canceled out and normalized
  // e.g. kg / month * year => kg
  // Where units are mixed, the one used most is used.
  // m * m * km => m^3
  // Compound units are replace with their base units
  // kph / s => km/h s => km/s^2
  // N h / cm^2 => kg m/s^2 * h / cm^2 => kg / s cm^2
  // A multiple is also provided to translate the old unit into the new unit.
  simplify () {

    // TODO guard that this is not a simple unit.
    var node = this._simplifiedNode();
    node.value = node.multiplier.value();
    return node;
  }

  _simplifiedNode () {
    var self = this,
        multiplier = Multiple.one(),
        unit,
        myUnits;

    var dimensionalityNode = self._convertToDimensionDimensionalityMap(),
        dim2Unit = dimensionalityNode.map;


    // TODO options:
    // "scheme": "metric", "imperial", "si", "user"
    //  tons / (km km m) =>
    //    imperial: tons mi^-3
    //    metric: tonnes km^-3
    //    si: kg m^-3
    //    user: tons km^-3
    // compound: true, // should try and use compound named units.
    //  tons / (km km m) =>
    //    imperial: tons lt-1
    //
    if (!_.isEmpty(dimensionalityNode.namedCompoundUnits)) {
      myUnits = dimensionalityNode.simplified;
    } else {
      // we'll fill this in as we make changes.
      // myUnits = _.clone(this.getSimpleUnits());
    }

    // for each dimension...
    _.each(dim2Unit, function (i, dimension) {
      var unitMap = dim2Unit[dimension],

          // we make a list of things that need to be converted
          plan = planConversions(unitMap),
          // year^2 / month => { top: ["year", "year"], bottom: ["month"] }
          remainingList, direction;


      var increment = function increment (key, num) {
        function inc (map) {
          if (map[key]) {
            if (!(map[key] += num)) {
              delete map[key];
            }
          } else {
            map[key] = num;
          }
        }

        inc(myUnits);
        inc(unitMap);
      };

      // check if we need to cancel anything out.
      // i.e. if we have both a top and a bottom part of the plan.
      if (!_.isEmpty(plan.top) && !_.isEmpty(plan.bottom)) {
        var removalList;
        if (plan.top.length >= plan.bottom.length) {
          removalList = plan.bottom;
          remainingList = plan.top;
          direction = +1;
        } else {
          removalList = plan.top;
          remainingList = plan.bottom;
          direction = -1;
        }

        // the list with the smallest number of dimensions should be eradicated.
        // { top: [ year, year ], bottom: [ month ]}
        // removalList = [ month ]

        // myUnits will end up as the units we return.
        myUnits = myUnits || dimensionalityNode.simplified;


        // Now we have: the list of units we need to elminate.
        // we can pair off with units on the other side.
        _.each(removalList, function (removable) {

          var cancelable = remainingList.shift();

          // { year: 2, month: -1 } => { year: 1 }
          increment(removable, direction);
          increment(cancelable, -direction);

          // now calculate the multipler
          cancelable = self.unitsTable.getUnit(cancelable);
          removable = self.unitsTable.getUnit(removable);

          // cancelable = year
          // removable = month
          if (direction > 0) {
            multiplier = cancelable._convertSimpleUnit(multiplier, removable);
          } else {
            multiplier = removable._convertSimpleUnit(multiplier, cancelable);
          }
        });
        removalList.length = 0;
      }


      function magnitude(u){
        var value = unitMap[u],
            abs = value >= 0 ? value : -value;
        return abs;
      }
      function pickTheNicestOne (u) {
        var value = magnitude(u) * 1024;
        return value + 0;
      }

      if (_.size(unitMap) > 1) {


        var top, topUnit;
        
          // we have the situation where one dimension is represented
          // by multiple units (e.g. m cm), which could be weird.
        top = _.chain(unitMap).keys().max(magnitude).value();
        topUnit = self.unitsTable.getUnit(top);
        
        // it would be really nice if we could make this a cleverer
        // which unit we use to represent each dimension.
        
        // I don't understand this snippet, 
        // and that alarms me a little. See uses for direction.
        // direction = magnitude(top);
        // direction = direction >=0 ? 1 : -1;
        direction = 1;

        // use one if we've got one, but we have one if you need it.
        myUnits = myUnits || dimensionalityNode.simplified;

        _.each(unitMap, function (index, unit) {
          if (unit === top) {
            return;
          }

          var other = self.unitsTable.getUnit(unit),
              unitMag = magnitude(unit);


          // convert each one into the most common
          // 1 m^2 cm^3 => cm^5
          var conversion = other._convert(Multiple.one(), topUnit);

          var i = 0;
          for (; i < unitMag; i++) {
            // TODO a javascript number
            multiplier = multiplier._times(conversion);
          }

          increment(unit, -direction * unitMag);
          increment(top, direction * unitMag);
        });
      }
    });

    // TODO re-factor the new simplified unit, with the baseUnits that
    // we removed above.

    unit = self;
    if (myUnits) {
      unit = new CompoundUnit(this.unitsTable, myUnits);
      // multiplier = self.convert(multiplier, unit);
    } else {
      // No modifications were need:
      // * there were no named compound units
      // * there were no units of the same dimension that needed canceling out.
    }

    // Mutliply by the multiplier from converting named compound units to their base units.
    multiplier = multiplier._times(dimensionalityNode.multiplier);
    return {
      multiplier: multiplier,
      unit: unit
    };
  }

  _removeZeroDimensions (object) {
    _.each(object, function (i, key) {
      if (!object[key]) {
        delete object[key];
      }
    });
  }

  by (other) {
    // other is a compound unit
    var newCompound = _.clone(other.getSimpleUnits());
    var mySimpleUnits = this.getSimpleUnits();
    _.each(this.getSimpleUnits(), function (i, unitName) {
      newCompound[unitName] = (newCompound[unitName] || 0) + mySimpleUnits[unitName];
    });
    this._removeZeroDimensions(newCompound);
    return new CompoundUnit(this.unitsTable, newCompound);
  }

  per (other) {
    var newCompound = _.clone(other.getSimpleUnits());
    _.each(newCompound, function (i, unitName) {
      newCompound[unitName] = -newCompound[unitName];
    });
    var mySimpleUnits = this.getSimpleUnits();
    _.each(mySimpleUnits, function (i, unitName) {
      newCompound[unitName] = (newCompound[unitName] || 0) + mySimpleUnits[unitName];
    });
    this._removeZeroDimensions(newCompound);
    return new CompoundUnit(this.unitsTable, newCompound);
  }

  pow (power) {
    if (typeof power !== 'number') {
      throw new Error("UNIT_WITH_NON_NUMERICAL_POWER");
    }
    var newCompound = power ? _.clone(this.getSimpleUnits()) : {};
    _.each(newCompound, function (i, unitName) {
      newCompound[unitName] *= power;
    });
    return new CompoundUnit(this.unitsTable, newCompound);
  }

  accept (visitor) {
    ast.acceptVisitor(this, visitor, visitor.visitUnit, arguments);
  }

}
