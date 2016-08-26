var BatchTestCursorMaintenance = (function () {
  'use strict';

  var CM,
      test;
  main();

  function main() {
    // Assuming d8 environment.
    load('../cursor_maintainer.js');
    CM = CursorMaintainer;

    [ //'format',
      'adHoc',
      //'mockCursor',
      'meta',
      //'splitLevenshtein',
      //'frequencyRatios',
      'layer'
    ].forEach(function (approach) {
      print('-----', approach);
      test = new Test(CM[approach]);
      test.run('trimify');
    });
    //(new Test()).display('commatize', false);
  }


  function TestCase(rawText, rawCursor,
      expectedText, expectedCursor) {
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
  function Test(formatters) {
    var testData = {
      commatize: [
        new TestCase('2500', 1, '2,500', 1),
        new TestCase('12500', 3, '12,500', 4),
        new TestCase('5,4990000', 9, '54,990,000', 10),
        new TestCase('1,,8,,,', 3, '18', 1),
        new TestCase('1,0,0,000', 3, '100,000', 2),
        new TestCase('1,0,000', 2, '10,000', 1),
        new TestCase('1,,000', 2, '1,000', 1),
        new TestCase('1,00', 2, '100', 1),
        new TestCase('1234', 1, '1,234', 1),
        new TestCase('1,0234', 3, '10,234', 2),
        new TestCase('10,00', 4, '1,000', 4),
        new TestCase('900', 0, '900', 0),
        new TestCase(',900', 1, '900', 0),
        new TestCase('123,900', 0, '123,900', 0),
        new TestCase(',123,900', 0, '123,900', 0),
      ],
      trimify: [
        new TestCase('  hello  ', 8, 'hello ', 6),
        new TestCase('  hello  ', 1, 'hello ', 0),
        new TestCase('Hello,  friends.', 7, 'Hello, friends.', 7),
        new TestCase('Hello,  friends.', 8, 'Hello, friends.', 7),
        new TestCase('  whirled    peas  now  ', 9, 'whirled peas now ', 7),
        new TestCase('  whirled    peas  now  ', 10, 'whirled peas now ', 8),
        new TestCase('  whirled    peas  now  ', 11, 'whirled peas now ', 8),
        new TestCase('  whirled    peas  now  ', 12, 'whirled peas now ', 8),
        new TestCase('  whirled    peas  now  ', 13, 'whirled peas now ', 8),
        new TestCase('     ', 3, '', 0),
        new TestCase(' th', 3, 'th', 2),
        new TestCase('the', 3, 'the', 3),
        new TestCase('the ', 4, 'the ', 4),
        new TestCase('the  ', 5, 'the ', 4),
        new TestCase('the   ', 6, 'the ', 4),
        new TestCase('the q', 5, 'the q', 5),
        new TestCase('the q ', 6, 'the q ', 6),
        new TestCase('the q  ', 7, 'the q ', 6),
        new TestCase('the q   ', 7, 'the q ', 6),
        new TestCase('the q   ', 8, 'the q ', 6),
        new TestCase('the q    ', 7, 'the q ', 6),
        new TestCase(' the q', 6, 'the q', 5),
        new TestCase(' the q ', 7, 'the q ', 6),
        new TestCase(' the q  ', 8, 'the q ', 6),
        new TestCase(' the q   ', 8, 'the q ', 6),
        new TestCase(' the q   ', 9, 'the q ', 6),
        new TestCase(' the q    ', 8, 'the q ', 6),
      ]
    };

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
  }  // end Test

})();
