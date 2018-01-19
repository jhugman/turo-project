import tap from 'tap';
import _ from 'underscore';
import $turo from '../lib/turo';
import graphBuilder from '../lib/document/document-graph-builder';

const { test, plan } = tap;

var turo, doc;

function setup () {
  turo = new $turo.Turo(); 
}

function createId (lineNum) {
  return '_' + lineNum;
}

function parseLines (lines) {
  var i = 1;
  var nodes = turo.parse(lines.join('\n') + '\n', 'EditorText').lines;

  _.each(nodes, function (node) {
    node._id = createId(i);
    i++;
  });
  return nodes;
}


function testGraph(t, g, lines, expected) {

  var observed = g.overallOrder();

  observed = _.filter(observed, function (id) {
    return (id + '').indexOf(':') < 0;
  });

  console.log(lines + ': ' + JSON.stringify(observed));
  expected = _.map(expected, createId);

  t.deepEqual(observed, expected, lines.join(', '));

}

function testInitialGraph(t, lines, expected) {
  // reset scope only on initial graph.
  turo.resetScope();
  // also, we only need parse the first time for statements out of order.
  turo.parse(lines.join('\n') + '\n', 'EditorText');

  var nodes = parseLines(lines);
  var graph = graphBuilder.buildInitialGraph(nodes);

  testGraph(t, graph.execution, lines, expected);

  var nodeMap = _.chain(nodes)
    .pluck('_id')
    .object(nodes)
    .value();

  doc = {
    graph: graph,
    nodes: nodeMap,
  };

  return doc;
}

function nodeFinder (id) {
  return doc.nodes[id];
}

function testInteractive(t, lineNum, line, expected, overwriteVariableDefinitions) {
  var nodes = turo.parse(line + '\n', 'EditorText').lines,
      newNode = nodes[0],
      id = createId(lineNum),
      oldNode = doc.nodes[id];

  newNode._id = id;
  doc.nodes[id] = newNode;

  var updateGraph = graphBuilder.updateGraph(doc.graph, id, oldNode, newNode, nodeFinder, overwriteVariableDefinitions);
  testGraph(t, updateGraph, [lineNum, line], expected);
}

test('buildInitialGraph with variables', function (t) {
  setup();
  testInitialGraph(t, ['x = 1', 'y = x', 'z = y'], [1, 2, 3]);
  testInitialGraph(t, ['x = 1', 'z = y', 'y = x', ], [1, 3, 2]);
  testInitialGraph(t, ['x = 1', 'y = x', 'z = x'], [1, 2, 3]);
  t.end();
});

test('buildInitialGraph without variables', function (t) {
  testInitialGraph(t, ['1', '2', '3'], [1, 2, 3]);
  testInitialGraph(t, ['1', '2', 'x = 3'], [1, 2, 3]);
  testInitialGraph(t, ['1', 'a = 2', 'x = 3'], [1, 2, 3]);
  testInitialGraph(t, ['a + x', 'a = 2', 'x = 3'], [2, 3, 1]);

  testInitialGraph(t, ['x = 1', '2', '3'], [1, 2, 3]);

  t.end();
});

test('Simple interactiveUpdate', function (t) {
  setup();
  testInitialGraph(t, ['p = 1', 'q = p', 'r = q'], [1, 2, 3]);
  testInteractive(t, '1', 'p = 2', /* p = 2, q = p, r = q */ [1, 2, 3]);
  testInteractive(t, '2', 'q = 3', /* p = 2, q = 3, r = q */ [2, 3]);
  testInteractive(t, '1', 'p = 1', /* p = 1, q = 3, r = q */ [1]);
  testInteractive(t, '2', 'q = p', /* p = 1, q = p, r = q */ [2, 3]);
  t.end();
});


test('interactive update with duplicate variables', function (t) {
  setup();
  testInitialGraph(t, ['p = 1', 'p = 2', 'q = p'], [1, 2, 3]);
  testInteractive(t, '1', 'p = 3', /* p = 3, p = 2, q = p */ [1]);
  testInteractive(t, '2', 'p = 4', /* p = 3, p = 4, q = p */ [2, 3]);

  t.end();
});

test('removing duplicate variables', function (t) {
  setup();
  testInitialGraph(t, ['p = 3', 'p = 4', 'q = p'], [1, 2, 3]);

  // remove the last declaration of p. the next last declaration takes over
  testInteractive(t, '2', '4',     /* p = 3, 4,     q = p */ [2, 3]);
  testInteractive(t, '2', '5',     /* p = 3, 5,     q = p */ [2]);

  t.end();
});

test('adding duplicate variables', function (t) {
  setup();
  testInitialGraph(t, ['p = 3', '5', 'q = p'], [2, 1, 3]); // ok, but wtf

  // add a new declaration of p. it takes over from the last
  testInteractive(t, '2', 'p = 6', /* p = 3, p = 6, q = p */ [2, 3]);
  
  // delete it again, just like above.
  testInteractive(t, '2', '7',     /* p = 3, 7,     q = p */ [2, 3]);

  // do the same, but add a new declaration further up in the document.
  testInitialGraph(t, ['5', 'p = 8', 'q = p'], [1, 2, 3]); // ok

  // add a new declaration of p. it takes over from the last
  testInteractive(t, '1', 'p = 9', /* p = 9, p = 8, q = p */ [1]);
  testInteractive(t, '1', '5',     /* 5    , p = 8, q = p */ [1]);


  testInitialGraph(t, ['q = p', 'p = 1', '2'], [2, 1, 3]); // Same as above but define q first.

  // This is especially important in the REPL use case.

  // add a new declaration of p. it takes over from the last
  testInteractive(t, '3', 'p = 3', /* q = p, p = 1, p = 3| */ [3, 1]);
  testInteractive(t, '3', '4',     /* q = p, p = 1, 4| */     [3, 1]);


  t.end();
});

test('document model', function (t) {

  testInitialGraph(t, ['x = 1', 'y + 2', 'y = x + z', 'z = x + 3'], [1, 4, 3, 2]);
  testInteractive(t, '1', 'x = 2', [1, 4, 3, 2]); // x = 2|, y + 2, y = x + z, z = x + 3
  testInteractive(t, '2', '1 + 2', [2]);          // x = 2, 1 + 2|, y = x + z, z = x + 3
  testInteractive(t, '1', 'x = 1', [1, 4, 3]);    // x = 1|, 1 + 2, y = x + z, z = x + 3

  t.end();
});

test('document model2', function (t) {
  
  var lines = ['a = 1', 'a = 2', 'y = a'];
  testInitialGraph(t, lines, [1, 2, 3]);

  // Change the first one, it should have no effect on 
  // the others.
  testInteractive(t, 1, 'a = 3', [1]); // a = 3|, a = 2, y = a

  // Change the second one, it should cascade to 
  // the others.
  testInteractive(t, 2, 'a = 4', [2, 3]); // a = 3, a = 4|, y = a

  // Change it back, to fit in with the rest of the tests.
  testInteractive(t, 2, 'a = 2', [2, 3]); // a = 3, a = 2|, y = a

  // Delete the second one, so that the first one 
  // is now the one that cascades.
  testInteractive(t, 2, '4', [2, 3]); // a = 3, 4|, y = a

  // Change the only one left, it should update the 
  // others.
  testInteractive(t, 1, 'a = 5', [1, 3]); // a = 5|, 4, y = a
  testInteractive(t, 2, 'a = 6', [2, 3]); // a = 3, a = 6|, y = a
  debugger;
  testInteractive(t, 2, 'x = 7', [2, 3]); // a = 3, x = 7|, y = a
  t.end();
});


test('Cascade: new definitions can overwrite old ones, by an additional parameter', function (t) {
  setup();
  var overwriteExistingDefinitions = false;
  testInitialGraph(t, ['x = 1', 'y = x + 1', '0', '0', '0'], [1, 2, 3, 4, 5]);
  testInteractive(t, '3', 'x = 2', /* x = 1, y = x + 1, x = 2|, 0, 0 */ [3, 2], overwriteExistingDefinitions);
  testInteractive(t, '4', 'y = 3', /* x = 1, y = x + 1, x = 2, y = 3|, 0 */ [4], overwriteExistingDefinitions);
  testInteractive(t, '5', 'x = 4', /* x = 1, y = x + 1, x = 2, y = 3, x = 4| */ [5, 2], overwriteExistingDefinitions);

  overwriteExistingDefinitions = true;
  testInitialGraph(t, ['x = 1', 'y = x + 1', '0', '0', '0'], [1, 2, 3, 4, 5]);
  testInteractive(t, '3', 'x = 2', /* x = 1, y = x + 1, x = 2|, 0, 0 */ [3, 2], overwriteExistingDefinitions);
  testInteractive(t, '4', 'y = 3', /* x = 1, y = x + 1, x = 2, y = 3|, 0 */ [4], overwriteExistingDefinitions);
  testInteractive(t, '5', 'x = 4', /* x = 1, y = x + 1, x = 2, y = 3, x = 4| */ [5], overwriteExistingDefinitions);
  t.end();
});

test('complicated obsoletes ', function (t) {

  testInitialGraph(t, ['a = 1', 'b = 2', 'x = a', 'x = b', 'y = x'], [1, 3, 2, 4, 5]);
  testInteractive(t, '3', 'x = a + 1', [3]);      // a = 1, b = 2, x = a + 1|, x = b, y = x
  testInteractive(t, '2', 'b = 3', [2, 4, 5]);    // a = 1, b = 3|, x = a + 1, x = b, y = x
  testInteractive(t, '1', 'a = 4', [1, 3]);    // a = 4|, b = 3, x = a + 1, x = b, y = x

  // We won't be touching line 4 here, so it shouldn't cascade after 4.
  testInteractive(t, '6', 'x = 5', [6, 5]);    // a = 4, b = 3, x = a + 1, x = b, y = x, x = 5|
  testInteractive(t, '2', 'b = 6', [2, 4]);    // a = 4, b = 6|, x = a + 1, x = b, y = x, x = 5
  t.end();
});

test('non-definition expression bug', function (t) {
  setup();
  testInitialGraph(t, ['x = 1'], [1]);
  testInteractive(t, '2', 'x + 2', [2]);
  t.end();
});

