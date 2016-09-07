var BatchTestCursorMaintenance = (function () {
  'use strict';

  // BatchTestCursorMaintenance is a command-line testing module for the
  //  cursor-maintenance algorithms implemented in cursor_maintainer.js
  //  and cursor_maintainer_experiments.js, which should be in the parent
  //  directory above this script. You can execute this script with d8,
  //  the command-line environment bundled with the V8 JavaScript engine.

  var CME,
      data,
      test;

  load('../cursor_maintainer.js');
  load('../cursor_maintainer_experiments.js');
  CME = CursorMaintainerExperiments;
  data = makeTestData();
  print(Object.keys(data));

  [ //'format',
    'adHoc',
    'mockCursor',
    'meta',
    //'splitLevenshtein',
    'frequencyRatios',
    'layer'
  ].forEach(function (approach) {
    print('-----', approach);
    test = new Test(CME[approach], data);
    test.run('trimify');
  });
  //(new Test()).display('commatize', false);
 
  // makeTestData defines all the test cases that are used in this module.
  function makeTestData() {
    return {
      commatize: [
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
      ].map(tupleToTestCase),
      trimify: [
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
      ].map(tupleToTestCase)
    };
  };

  // tupleToTestCase takes a four-element array which serves as a terse
  //  representation of a test case and turns it into a verbose object.
  function tupleToTestCase(tuple) {
    var rawText = tuple[0],
        rawCursor = tuple[1],
        expectedText = tuple[2],
        expectedCursor = tuple[3];
    return {
      raw: { text: rawText, cursor: rawCursor },
      expected: { text: expectedText, cursor: expectedCursor }
    };
  };


  /* Test describes the expected behavior of certain formatters.
     It provides test data and a test runner that can be used to
     exercise the formatters with or without cursor maintenance.
     The constructor takes an object that maps a format name to
     a formatter. */
  function Test(formatters, testData) {

    /* showText prints out a single test string and optionally displays
       the cursor position below it. */
    function showText(label, text, cursor) {
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
    }

    /* display prints out the test pairs for a specified format. */
    function display(name, showCursor) {
      var rawCursor,
          expectedCursor,
          testCases,
          testCase, i;
      if (showCursor === undefined) {
        showCursor = true;
      }
      if (!name) {
        print();
        Object.keys(testData).sort().forEach(function (name) {
          display(name, showCursor);
        });
        return;
      }
      print('Test cases for ' + name + '\n');
      testCases = testData[name];
      for (i = 0; i < testCases.length; ++i) {
        testCase = testCases[i];
        if (showCursor) {
          rawCursor = testCase.raw.cursor;
          expectedCursor = testCase.expected.cursor;
        }
        showText('     raw', testCase.raw.text, rawCursor);
        showText('expected', testCase.expected.text, expectedCursor);
        print();
      }
    }

    /* run tests a specified format or all of them. */
    function run(name, withCursor) {
      var format,
          passing,
          testCases,
          testCase, i,
          raw,
          expected,
          received;
      if (withCursor === undefined) {
        withCursor = true;
      }
      if (!name) {
        print();
        Object.keys(testData).sort().forEach(function (name) {
          run(name, withCursor);
          print();
        });
        return;
      }
      print('Testing ' + name);
      format = formatters[name];
      passing = true;
      testCases = testData[name];
      for (i = 0; i < testCases.length; ++i) {
        testCase = testCases[i];
        raw = testCase.raw;
        expected = testCase.expected;
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
      }
      if (passing) {
        print('passed');
      }
      return passing;
    }

    return {
      display: display,
      run: run
    };
  } // end Test

})();
