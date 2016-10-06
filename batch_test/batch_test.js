var BatchTestCursorMaintenance = (function () {
  'use strict';

  var targetDirectory = '..';

  // BatchTestCursorMaintenance is a command-line testing module for the
  //  cursor-maintenance algorithms implemented in cursor_maintainer.js
  //  and cursor_maintainer_experiments.js.
  //  You can execute this file with js or d8, which are Mozilla's and
  //  Google's JavaScript command-line environments.

  // main instantiates the test runners with a set of test cases for each
  //  format, loads the targeted files, and proceeds to test a selection
  //  of cursor-maintenance approaches and formats.
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
          ]),
          creditCard: new TestRunner([
            [ '  19203 45  ', 1, '1920 345', 0 ],
            [ '  19203 45  ', 2, '1920 345', 0 ],
            [ '  19203 45  ', 3, '1920 345', 1 ],
            [ '  19203 45  ', 4, '1920 345', 2 ],
            [ '  19203 45  ', 5, '1920 345', 3 ],
            [ '  19203 45  ', 6, '1920 345', 4 ],
            [ '  19203 45  ', 7, '1920 345', 6 ],
            [ '  19203 45  ', 8, '1920 345', 6 ],
            [ '  19203 45  ', 9, '1920 345', 7 ],
            [ '  19203 45  ', 10, '1920 345', 8 ],
            [ '  19203 45  ', 11, '1920 345', 8 ],
            [ '  19203 45  ', 12, '1920 345', 8 ],
            [ '2903  1928 7979 9894', 5, '2903 1928 7979 9894', 4 ],
            [ '29031928 7979 9894', 4, '2903 1928 7979 9894', 4 ],
            [ '2903 1928  7979 9894', 10, '2903 1928 7979 9894', 9 ],
            [ '2903 19287979 9894', 9, '2903 1928 7979 9894', 9 ],
            [ '2903 1928 7979  9894', 15, '2903 1928 7979 9894', 14 ],
            [ '2903 1928 79799894', 14, '2903 1928 7979 9894', 14 ]
          ])
        };

    load(targetDirectory + '/cursor_maintainer.js');
    load(targetDirectory + '/cursor_maintainer_experiments.js');
    implementations = CursorMaintainerExperiments;

    // Each approach named in the following array is tested with each format
    //  named in the nested array. To omit an approach or a format, comment
    //  out its name. The approach name is used to look up an implementation
    //  of a cursor-maintenance approach, and the format name is used to
    //  look up a cursor-maintaining formatter in the implementation object.
    //  There is one test runner for each format.
    //  The 'format' implementation contains plain formatters that are
    //  wrapped to look like cursor-maintaining formatters, but they return
    //  the raw cursor position as is. The purpose of 'format' is to let us
    //  verify the text returned by cursor-maintenance approaches that
    //  reimplement a format. If we only want to test the formatting and
    //  ignore the cursor maintenance, we pass a true (or truthy) value
    //  as the optional second argument to TestRunner.run. To display the
    //  test cases without testing them, call TestRunner.display.
    [ //'format',
      //'adHoc',
      //'mockCursor',
      //'meta',
      'splitLevenshtein',
      'frequencyRatios',
      'layer'
    ].forEach(function (approachName) {
      var implementation = implementations[approachName];
      print('-----', approachName);
      [ //'commatize',
        //'trimify',
        'creditCard'
      ].forEach(function (formatName) {
        print('testing', formatName);
        //testRunners[formatName].display(false);
        testRunners[formatName].run(implementation[formatName], false);
      });
    });
  }

  // TestRunner instantiates an object with a set of test cases that are
  //  passed in as an array of four-element arrays, each of which contains
  //  a single test case. The four elements are the raw text, raw cursor,
  //  expected text, and expected cursor. The test case gets wrapped in
  //  a nested object for convenient access during testing.
  function TestRunner(tuples) {
    this.testCases = tuples.map(function (tuple) {
      return {
        raw: { text: tuple[0], cursor: tuple[1] },
        expected: { text: tuple[2], cursor: tuple[3] }
      };
    });
  }

  // TestRunner.showText prints a given label followed by a given text value.
  //  The third argument, a cursor position, is optional; if specified,
  //  the cursor position is indicated by a special character printed on
  //  a new line below the text.
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

  // TestRunner.display iterates over the test cases, printing the raw text
  //  and expected text for each one. By default the cursor positions are also
  //  printed. If the optional argument ignoreCursor is truthy, the cursor
  //  positions are not printed.
  TestRunner.prototype.display = function (ignoreCursor) {
    var showText = this.showText;
    this.testCases.forEach(function (testCase) {
      var rawCursor,
          expectedCursor;
      if (!ignoreCursor) {
        rawCursor = testCase.raw.cursor;
        expectedCursor = testCase.expected.cursor;
      }
      showText('     raw', testCase.raw.text, rawCursor);
      showText('expected', testCase.expected.text, expectedCursor);
      print();
    });
  };

  // TestRunner.run executes the specified cursor-maintaining formatter on
  //  all test cases. In each case, if the new text fails to match the
  //  expected text or the new cursor position fails to match the expected
  //  cursor position, the failure is displayed. If the optional argument
  //  ignoreCursor is truthy, the cursor positions are not tested.
  TestRunner.prototype.run = function (format, ignoreCursor) {
    var passing = true,
        showText = this.showText;
    this.testCases.forEach(function (testCase) {
      var raw = testCase.raw,
          expected = testCase.expected,
          received = format(raw.text, raw.cursor);
      if (received.text != expected.text || (!ignoreCursor &&
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
