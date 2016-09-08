var BatchTestRunnerCursorMaintenance = (function () {
  'use strict';

  // BatchTestRunnerCursorMaintenance is a command-line testing module for the
  //  cursor-maintenance algorithms implemented in cursor_maintainer.js
  //  and cursor_maintainer_experiments.js, which should be in the parent
  //  directory above this file. You can execute this file with d8,
  //  the command-line environment bundled with the V8 JavaScript engine.

  function main() {
    var implementations,
        testRunners = {
          commatize: new TestRunner([
            [ '2500', 1, '2,500', 1 ],
            [ '12500', 3, '12,500', 4 ],
            [ '5,4990000', 9, '54,990,000', 10 ],
            [ '1,,8,,,', 3, '18', 1 ],
            [ '1,0,0,000', 3, '100,000', 2 ],
            [ '1,0,000', 2, '10,000', 1 ],
            [ '1,,000', 2, '1,000', 1 ],
            [ '1,00', 2, '100', 1 ],
            [ '1234', 1, '1,234', 1 ],
            [ '1,0234', 3, '10,234', 2 ],
            [ '10,00', 4, '1,000', 4 ],
            [ '900', 0, '900', 0 ],
            [ ',900', 1, '900', 0 ],
            [ '123,900', 0, '123,900', 0 ],
            [ ',123,900', 0, '123,900', 0 ]
          ]),
          trimify: new TestRunner([
            [ '  hello  ', 8, 'hello ', 6 ],
            [ '  hello  ', 1, 'hello ', 0 ],
            [ 'Hello,  friends.', 7, 'Hello, friends.', 7 ],
            [ 'Hello,  friends.', 8, 'Hello, friends.', 7 ],
            [ '  whirled    peas  now  ', 9, 'whirled peas now ', 7 ],
            [ '  whirled    peas  now  ', 10, 'whirled peas now ', 8 ],
            [ '  whirled    peas  now  ', 11, 'whirled peas now ', 8 ],
            [ '  whirled    peas  now  ', 12, 'whirled peas now ', 8 ],
            [ '  whirled    peas  now  ', 13, 'whirled peas now ', 8 ],
            [ '     ', 3, '', 0 ],
            [ ' th', 3, 'th', 2 ],
            [ 'the', 3, 'the', 3 ],
            [ 'the ', 4, 'the ', 4 ],
            [ 'the  ', 5, 'the ', 4 ],
            [ 'the   ', 6, 'the ', 4 ],
            [ 'the q', 5, 'the q', 5 ],
            [ 'the q ', 6, 'the q ', 6 ],
            [ 'the q  ', 7, 'the q ', 6 ],
            [ 'the q   ', 7, 'the q ', 6 ],
            [ 'the q   ', 8, 'the q ', 6 ],
            [ 'the q    ', 7, 'the q ', 6 ],
            [ ' the q', 6, 'the q', 5 ],
            [ ' the q ', 7, 'the q ', 6 ],
            [ ' the q  ', 8, 'the q ', 6 ],
            [ ' the q   ', 8, 'the q ', 6 ],
            [ ' the q   ', 9, 'the q ', 6 ],
            [ ' the q    ', 8, 'the q ', 6 ]
          ])
        };

    load('../cursor_maintainer.js');
    load('../cursor_maintainer_experiments.js');
    implementations = CursorMaintainerExperiments;

    [ //'format',  // format contains plain formatters (no cursor maintenance).
      'adHoc',
      'mockCursor',
      'meta',
      //'splitLevenshtein',
      'frequencyRatios',
      'layer'
    ].forEach(function (approachName) {
      var implementation = implementations[approachName];
      print('-----', approachName);
      [ //'commatize',
        'trimify'
      ].forEach(function (formatName) {
        print('testing', formatName);
        testRunners[formatName].run(implementation[formatName]);
      });
    });
  }

  function TestRunner(tuples) {
    this.testCases = tuples.map(function (tuple) {
      return {
        raw: { text: tuple[0], cursor: tuple[1] },
        expected: { text: tuple[2], cursor: tuple[3] }
      };
    });
  }

  /* showText prints out a single test string and optionally displays
     the cursor position below it. */
  TestRunner.prototype.showText = function (label, text, cursor) {
    var parts, i,
        prefix = '  ' + label + ': "';
    print(prefix + text + '"');
    if (cursor !== undefined) {
      parts = [];
      for (i = prefix.length + cursor; i > 0; --i) {
        parts.push(' ');
      }
      parts.push('↖ ' + cursor);
      print(parts.join(''));
    }
  };

  TestRunner.prototype.display = function (showCursor) {
    var showText = this.showText;
    if (showCursor === undefined) {
      showCursor = true;
    }
    print('TestRunner cases for ' + name + '\n');
    this.testCases.forEach(function (testCase) {
      var testCase = this.testCases[i],
          rawCursor,
          expectedCursor;
      if (showCursor) {
        rawCursor = testCase.raw.cursor;
        expectedCursor = testCase.expected.cursor;
      }
      showText('     raw', testCase.raw.text, rawCursor);
      showText('expected', testCase.expected.text, expectedCursor);
      print();
    });
  };

  /* run tests a specified format or all of them. */
  TestRunner.prototype.run = function (format, withCursor) {
    var passing = true,
        showText = this.showText;
    if (withCursor === undefined) {
      withCursor = true;
    }
    this.testCases.forEach(function (testCase) {
      var raw = testCase.raw,
          expected = testCase.expected,
          received = format(raw.text, raw.cursor);
      if (received.text != expected.text || (withCursor &&
          received.cursor != expected.cursor)) {
        //print('failed (with' + (withCursor ? '' : 'out') + ' cursor)');
        print();
        showText('     raw', raw.text, raw.cursor);
        showText('expected', expected.text, expected.cursor);
        showText('received', received.text, received.cursor);
        passing = false;
      }
    });
    if (passing) {
      print('passed');
    }
    return passing;
  };

  main();
})();
