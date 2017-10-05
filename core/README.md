turo
====

A small calculator language. Implemented in javascript.

The parser is implemented using pegjs.

The language itself, is still very much in flux.

It isn't even clear to me that this is meant to be a language.

Currently turo does a couple of things really well:

 * The units system is quite powerful, 
   - definition language, including defining units in terms of one another e.g. `unit 100 cm : m;`
   - compound units (m^, m/s), named compound units (1 mph = 1 mi/h)
   - A bunch of API tools used in the language.

 * Variables
   - define and use variables from within the language. 
   - usage of a variable is tracked, so when it changes subsequent changes can be displayed without further user intervention

 * Types
   - There is a tiny, rudimentary type system which chooses operations based on operand types. None of this is obvious to the language user.
   - There is no struct or object format, so this isn't user-extendable.
   - Currently only 'number' is used, but others to consider: boolean, sequence, function, date
   - Operations can be trivially added by adding to the `operators-default-table.js` file.
   - "Types" cascade up the AST, derived from the operations used to combine them. e.g. date + duration = date



Repl
----
You can start the REPL by starting in the `turo` directory:

```
$ git clone git@github.com:jhugman/turo.git
$ cd git
$ npm install
$ npm start

> turo@0.0.1 start $location
> node lib/repl.js --strict
 >> 
```



Let's start by adding a unit, that turo doesn't know about. 
```
 >> unit parsec : 1e31 m
```

This definition tells turo that `parsec` is something that has the same dimensionality as `m` i.e. `Length`, and how to convert between `parsec` and `m`. By doing this, now turo knows how to convert between `parsec` and any other unit of dimension `Length`.

```
 >> 1 parsec in km
... 1 parsec in km = 1e+28 km
```

At this point, we should show tab complete:
```
 >> 1 p
pint    pt      picas   px      parsec  

 >> 1 parsec in km
... 1 parsec in km = 1e+28 km
```

You can combine and define units how you might expect.

```
 >> unit barrel : 0.159 m^3
...
```
The caret denotes raising to the power of, so that's 0.159 cubic metres.

So if we want to imagine how big a cube that would hold a barrel of oil, we can do this: 

```
 >> 3 nth_root 1 barrel in cm
... 3 nth_root 1 barrel in cm = 54.175015149772 cm
 >> 3 nth_root 1 barrel in inch
... 3 nth_root 1 barrel in inch = 21.328746121957 inch
```
The `nth_root` operator is rather ugly, and looks better on something the app controls the input a bit more tightly.

Naturally we can also use existing units, including named compound units to define our new ones.
```
 >> unit tsp teapoon (Kitchen) : 5 ml
... 
 >> unit tbsp tablespoon : 3 tsp
...
```
We can now do conversions like:
```
 >> 2 tbsp in cm^3
... 2 tbsp in cm^3 = 30 cm^3
```
(because we know that we can get from tbsp -> liter -> cm^3)
and even more exotic, we can convert from cm^3 to inch^3 because we know the ratio of cm : inch.
```
 >> 2 tbsp in inch^3
... 2 tbsp in inch^3 = 1.830712322842 inch^3

```
The definition files are in `includes/`, and start at `includes/app.turo`

We can do more than just explicit unit conversions. We can do arithmetic with numbers with units.

```
 >> 6 ft + 2 inch
... 6 ft + 2 inch = 6.1666666666667 ft
 >> 1 litre + 1 gallon
... 1 litre + 1 gallon = 5.54609 litre
 >> 100 m / 10 s
... 100 m / 10 s = 10 m/s
 >> 5 year * 200 m^2 / year
... 5 year * 200 m^2/year = 1000 m^2
 >> 1 * sqrt(10 cm * 14.4 cm))
... 1 * sqrt (10 cm * 14.4 cm) = 12 cm
```

NB It's only recently occurred to me that units have the same operator precedence as multiply and divide, so there is a bit too much special casing going on, and known issues.

Error detection is brilliant, but error reporting is -terrible- best effort at best. You can only add and subtract units of the same dimension.

```
 >> 1 m + 1 kg
... Eval problem, DIMENSION_MISMATCH: 1 m + 1 kg
                                      ^^^^^^^^^^
 >> 2 / (3 - 9 * 1/3)
... Eval problem, DIVIDE_BY_ZERO: 2 / (3 - 9 * 1/3)
                                      ^^^^^^^^^^^^^                                      
```

More unit definition language
--

There are a couple more things to talk about with unit definition. This section is here more for completeness and fiddly questions than being particularly useful in a primer.

You can define units in terms of one another, but the fundamental units themselves need definitions:
```
unit m : Length
```

This defines `m` as a fundamental unit of the `Length` dimension. The dimensions pretty much look after themselves, e.g. defining a unit a unit `cm` as a proportion of `m`, `cm` will also have a dimension of `Length`.

```
unit 100 cm : m;
```

The dimensions are compared when testing if we can add or substract two units.

While this is designed to be suitable for the fundamental dimensions, it is also good for measures that don't have fundamental dimensions: 

```
unit deg : Angle
```

You can name compound dimensions when you define the corresponding unit, after the colon, but before the units it being defined as: 

```
unit kph : Speed, 1 km/h
```

Once this has been defined, anything that is defined in terms of `Length/Time` is identified as `Speed`.

Where synonyms of the same unit exist, turo will parse this, but not do anything with it. This is an unimplemented future feature.

```
unit 3 ft foot feet : yd;
```

Finally, to make managing vast number of units easier, for example making a keyboard from the units we've defined, you can define unit schemes: these are names of units systems.

```
unit yard (Imperial) : 1 m;
```

Units can belong to more than one unit scheme, and can be defined all at once, or by adding more unit schemes later on.

```
unit m (SI Metric) : Length
```

or: 

```
unit m (SI) : Length
unit m (Metric)
```

Unless you're adding a unit scheme, the unit scheme will propogate to the new units:

```
unit Pa pascal (Science) : Pressure, 1 N/m^2
unit kPa kilopascal : 1000 Pa
```

Now, `kPa` will have the same dimension and unit scheme as `Pa`.

Units without unit schemes will appear in all unit schemes. e.g.

```
unit s seconds : Time
```

Variables
-----
So we have these units. How can we really use them?

It would be lovely to be able to write out equations with units in them.

```turo
 >> weight = 150 lb
... weight = 150 lb = 150 lb
 >> height = 6 ft + 2 inch
... height = 6 ft + 2 inch = 6.1666666666667 ft
 >> body_mass_index = (weight in kg) / (height in m)^2
... body_mass_index = (weight in kg) / (height in m) ^ 2 = 19.258662700123 kg/m^2
```

But say now, my weight changes to 148 lb:
```
 >> weight = 148 lb
... weight = 148 lb = 148 lb
... body_mass_index = (weight in kg) / (height in m) ^ 2 = 19.001880530788 kg/m^2
```

The change in `weight` triggers `body_mass_index` to be re-calculated. If `body_mass_index` was used in another equation, that too would be re-calculated. The cascade can be of arbitrary length, showing a logical sequence of updated calculations.

```
diameter = 10mm
radius = diameter / 2
volume = 4 / 3 * pi * radius^3
density = 2.5e3 kg/m^3
mass_per_marble = volume * density
mass_of_jar = 10 kg
number_of_marbles = mass_of_jar / mass_per_marble
```

Density is the density of glass and comes from [this table of solids](http://www.engineeringtoolbox.com/density-solids-d_1265.html) I found with Google.

```
 >> diameter = 10 mm
... diameter = 10 mm = 10 mm
... radius = diameter / 2 = 5 mm
... volume = 4 / 3 * pi * radius ^ 3 = 523.5987755983 mm^3
... mass_per_marble = volume * density = 0.001308996939 kg
... number_of_marbles = mass_of_jar / mass_per_marble = 7639.437268411 
 >> 
 >> diameter = 9 mm
... diameter = 9 mm = 9 mm
... radius = diameter / 2 = 4.5 mm
... volume = 4 / 3 * pi * radius ^ 3 = 381.70350741116 mm^3
... mass_per_marble = volume * density = 0.00095425876853 kg
... number_of_marbles = mass_of_jar / mass_per_marble = 10479.33781675 
 >> 
 >> diameter = 11 mm
... diameter = 11 mm = 11 mm
... radius = diameter / 2 = 5.5 mm
... volume = 4 / 3 * pi * radius ^ 3 = 696.90997032134 mm^3
... mass_per_marble = volume * density = 0.0017422749258 kg
... number_of_marbles = mass_of_jar / mass_per_marble = 5739.6222903163 
```

So, in a guess the number of marbles in a jar competition, we can see that changing the diameter even a little bit has an enormous effect on the number of marbles we think are in the jar. 

We may not know that the number of marbles is inversely proportional the cube of diameter, but we are able to play what ifs:

What if we find that the jar is actually 11 kg, instead of 10 kg. How much does mass_of_jar make a difference?

```
 >> mass_of_jar = 9 kg
... mass_of_jar = 9 kg = 9 kg
... number_of_marbles = mass_of_jar / mass_per_marble = 6875.4935415699 
 >>
 >> mass_of_jar = 10 kg
... mass_of_jar = 10 kg = 10 kg
... number_of_marbles = mass_of_jar / mass_per_marble = 7639.437268411 
 >> 
 >> mass_of_jar = 11 kg
... mass_of_jar = 11 kg = 11 kg
... number_of_marbles = mass_of_jar / mass_per_marble = 8403.3809952521
```

Or we can refine our idea of the mass of the jar: 

```
 >> mass_of_marbles_plus_jar = 10kg
... mass_of_marbles_plus_jar = 10 kg = 10 kg
 >> mass_of_empty_jar = 1.1 kg
... mass_of_empty_jar = 1.1 kg = 1.1 kg
 >> mass_of_jar = mass_of_marbles_plus_jar - mass_of_empty_jar
... mass_of_jar = mass_of_marbles_plus_jar - mass_of_empty_jar = 8.9 kg
... number_of_marbles = mass_of_jar / mass_per_marble = 6799.0991688858 
... mass_of_jar = 8.9 kg
```

If you plan on making a 'guess the number of marbles in a jar' competition, keep the size and total mass of the marbles a secret.

At this point, this collection of interelated statements can be called a 'model'.

Possible next steps for language
==

 * boolean types and operators to generate them from numbers e.g. p >= q; and use them e.g. a AND b, pattern matching (switch statements)
 * string types. Principally for generating messages with switch statements and booleans. 
 * more flexible unit conversion: 
   - 1 m in imperial -> 3 ft 3 in
   - 1 N in ft lb wk -> 1 lb ft/wk^2. This is principally to help builders of non-keyboard based UIs.
 * downloading, importing and caching of .turo files. To start with, this would be for up-to-date currency units, but will also be great for sharing of models.
 * functions. Bonus marks: definition language for functions. There are great reasons to do this, but UI would be difficult to implement, and don't want to get too bogged down in implementation, and/or theory.
 * sequence types and operators. sum(), product() would be possible. With functions reduce/map/find and generators become possible.
 * 'prompt' tokens. In all likelihood, this would be a lightweight token which decorates an existing value, which becomes the default.

Additional possible extension projects
---

 * desktop client, browser based probably.
 * server component to manage app distribution, sharing, .turo file updates (currency)

Broad themes of my interests
--
Make making models easier. (desktop/better apps)
  - I have a metaphor of model. It should feel like sculpting.
Make models more useful.
  - Aid back of the envelope calculations.
  - Savable, syncable models.
Make models more useful to each other.
  - personas: teacher/pupils, ben goldacre, john syracusa
  - sharing, importing, editing different form factors, more power
