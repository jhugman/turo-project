import _ from 'underscore';
import CompoundUnit from './CompoundUnit';
import Multiple from './Multiple';
import Dimension from './Dimension';
import UnitSchemeHelper from './unit-schemes';

/*********************************************
  Units table.
*********************************************/
function isStringOrUnit(obj) {
  return (typeof obj === 'string') ||
         (typeof obj === 'object' &&  obj.unitsTable);
}

export default class UnitsTable {
  constructor(initial) {
    this.units = initial || {};
    this.unitSchemes = new UnitSchemeHelper();
    // Big units table, including aliases.
    this._bigTable = {};
  }

  addUnit (name, relativeTo_x, relativeTo_units, unitSchemes, dimensionName, alternatives) {
    var unit;
    if (_.isString(relativeTo_x) && typeof relativeTo_units === 'undefined') {
      unit = this._addUnitWithDimension(name, relativeTo_x);
    } else if (typeof relativeTo_x === 'number' && typeof isStringOrUnit(relativeTo_units)) {
      unit = this._addUnitRelativeToAnotherUnit(name, relativeTo_x, 1, relativeTo_units);
    } else if (isStringOrUnit(relativeTo_x) && typeof relativeTo_units === 'number') {
      unit = this._addUnitRelativeToAnotherUnit(name, 1, relativeTo_units, relativeTo_x);
    } else if (isStringOrUnit(relativeTo_x) && typeof relativeTo_units === 'undefined') {
      unit = this._addUnitFromExistingUnit(name, relativeTo_x);
    } else {
      throw new Error("UNKNOWN UNIT SYNTAX");
    }

    if (unitSchemes && unitSchemes.length) {
      unit._unitSchemes_user = unitSchemes;
    }

    if (dimensionName) {
      unit.getDimension().shortName = dimensionName;
    }

    this.unitSchemes.addUnit(unit);

    if (alternatives) {
      this.addUnitAliases(unit, alternatives);
    }

    this._bigTable[name] = unit;

    return unit;
  }

  addUnitAliases (unit, aliases) {

    if (aliases.length === 0) {
      return;
    }
    
    var t = this._bigTable;
    _.each(aliases, function (n) {
        t[n] = unit;
    });

    var shortName = unit.name,
        singular = aliases[0] || unit.singular || shortName,
        plural = aliases[1] || unit.plural || singular;
    
    unit.singular = singular;
    unit.plural = plural;
    unit.alternatives = aliases;
  }

  addUnitSchemes (unit, schemes) {
    _.each(schemes, function (scheme) {
      unit.addUnitScheme(scheme);
    });
    this.unitSchemes.addUnit(unit, schemes);

  }

  _addUnitWithDimension (name, dimension) {
    this.units[name] = new CompoundUnit(this, name, new Dimension(dimension));
    return this.units[name];
  }

  _addUnitRelativeToAnotherUnit (name, t, b, other) {
    var self = this;
    if (typeof other === 'string') {
      other = this.getUnit(other);
    }

    var unit = new CompoundUnit(this, name, other.getDimension());

    if (other.name) {
      var src = unit.multiples || (unit.multiples = Multiple.container(name)),
          dst = other.multiples || (other.multiples = Multiple.container(other.name));

      _.each(dst, function (i, k) {
        var target = dst[k];
        src[k] = new Multiple(target.top * t, target.bottom * b);

        // this.multiples[name] || (this.multiples[name] = new Multiple());
        var existingUnit = self.getUnit(k),
            multiple = existingUnit.multiples[name] || (existingUnit.multiples[name] = new Multiple());

        multiple.set(b * target.bottom, t * target.top);

      });
    }

    if (other.baseUnit) {
      unit.baseUnit = other.baseUnit;
      unit.baseMultiple = new Multiple(other.baseMultiple.top * t, other.baseMultiple.bottom * b);
    } else if (!unit.getDimension().isSimple()) {
      unit.baseUnit = other;
      unit.baseMultiple = new Multiple(t, b);
    }

    unit.definitionMultiple = new Multiple(t, b);
    unit.definitionUnit = other;

    // Given no other details, we should be able to use this to work out our unit scheme.
    unit._unitSchemes = other.getUnitSchemes();


    this.units[name] = unit;
    return unit;
  }

  _addUnitFromExistingUnit (name, unit) {
    unit.name = name;
    this.units[name] = unit;
    return unit;
  }

  createUnitScheme (unitSchemeName, units) {
    var self = this;
    _.each(units, function (unit) {
      if (typeof unit === "string") {
        unit = self.units[unit];
      }
      if (unit && unit.addUnitScheme) {
        unit.addUnitScheme(unitSchemeName);
      }
    });

    _.each(self.units, function (i, key) {
      var unit = self.units[key];
      delete unit._unitSchemes;
    });
    // we'll generate it on demand,
    // but destroy the cache if we change anything.
  }

  getUnit (name) {
    return this._bigTable[name];
  }

  getUnitNames () {
    return _.keys(this.units);
  }

  getDimension (name) {
    // TODO this should return the Dimension object.
    return this.getUnit(name).getDimension();
  }

  convert (num, src, dest) {
    // TODO this should check for getUnit being falsey.
    var srcUnit = _.isString(src) ? this.getUnit(src) : src,
        dstUnit = _.isString(dest) ? this.getUnit(dest) : dest;
    if (srcUnit && dstUnit) {
      return srcUnit.convert(num, dstUnit);
    }
    console.error("Cannot find " + src + " unit");
    throw new Error("Cannot find " + src + " unit");
  }
}
