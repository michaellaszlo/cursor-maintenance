var DemonstrateCursorMaintenance = (function () {
  'use strict';

  function TestCase(originalText, originalCursor,
      expectedText, expectedCursor) {
    return {
      original: { text: originalText, cursor: originalCursor },
      expected: { text: expectedText, cursor: expectedCursor }
    };
  };

  function Test(formatter) {
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
        new TestCase('10,00', 4, '1,000', 4)
      ],
      trimify: [
        new TestCase('  hello  ', 8, 'hello', 5),
        new TestCase('  hello  ', 1, 'hello', 0),
        new TestCase('Hello,  friends.', 7, 'Hello, friends.', 7),
        new TestCase('Hello,  friends.', 8, 'Hello, friends.', 7),
        new TestCase('  whirled    peas  now  ', 9, 'whirled peas now', 7),
        new TestCase('  whirled    peas  now  ', 10, 'whirled peas now', 8),
        new TestCase('  whirled    peas  now  ', 11, 'whirled peas now', 8),
        new TestCase('  whirled    peas  now  ', 12, 'whirled peas now', 8),
        new TestCase('  whirled    peas  now  ', 13, 'whirled peas now', 8),
        new TestCase('     ', 3, '', 0)
      ]
    };

    function showText(label, text, cursor) {
      var parts, i,
          prefix = '  ' + label + ' "';
      print(prefix + text + '"');
      if (cursor !== undefined) {
        parts = [];
        for (i = prefix.length + cursor - 1; i >= 0; --i) {
          parts.push(' ');
        }
        parts.push(' ↖ ' + cursor);
        print(parts.join(''));
      }
    }

    function display(options) {
      var testCases,
          testCase, i,
          originalCursor,
          expectedCursor,
          options = options || {},
          showCursor = (options.hideCursor !== true);
      if (!('name' in options)) {
        print();
        Object.keys(testData).forEach(function (name) {
          options.name = name;
          display(options);
        });
        return;
      }
      print('Test cases for ' + options.name);
      testCases = testData[options.name];
      for (i = 0; i < testCases.length; ++i) {
        testCase = testCases[i];
        if (showCursor) {
          originalCursor = testCase.original.cursor;
          expectedCursor = testCase.expected.cursor;
        }
        showText('original', testCase.original.text, originalCursor);
        showText('expected', testCase.expected.text, expectedCursor);
        print();
      }
    }

    return {
      display: display
    };
  }

  function Formatter() {

    function commatize(s, cursor) {
    }

    function trimify(s, cursor) {
    }

    return {
      commatize: commatize,
      trimify: trimify
    };
  }

  var test = new Test(new Formatter());
  test.display();
})();
