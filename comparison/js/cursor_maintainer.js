var CursorMaintainer = (function () {
  'use strict';

  var formatter,
      numericalCursorFormatter,
      textualCursorFormatter,
      metaCursorFormatter,
      retrospectiveCursorFormatter,
      test;


  function TestCase(originalText, originalCursor,
      expectedText, expectedCursor) {
    return {
      original: { text: originalText, cursor: originalCursor },
      expected: { text: expectedText, cursor: expectedCursor }
    };
  };


  /* Test describes the behavior of a fixed set of formatting operations.
     It provides test data and a test runner that can be used to verify
     the formatting operations with or without cursor positioning.
     The constructor takes an object that implements the operations
     described by our test data. */
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

    /* showText prints out a single test string and optionally displays
       the cursor position below it. */
    function showText(label, text, cursor) {
      var parts, i,
          prefix = '  ' + label + ' "';
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

    /* display prints out the test pairs for a specified formatting
       operation. */
    function display(name, showCursor) {
      var originalCursor,
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
          originalCursor = testCase.original.cursor;
          expectedCursor = testCase.expected.cursor;
        }
        showText('original', testCase.original.text, originalCursor);
        showText('expected', testCase.expected.text, expectedCursor);
        print();
      }
    }

    /* run tests a specified formatting operation or all of them. */
    function run(name, withCursor) {
      var operation,
          passing,
          testCases,
          testCase, i,
          original,
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
      operation = formatter[name].bind(formatter);
      passing = true;
      testCases = testData[name];
      for (i = 0; i < testCases.length; ++i) {
        testCase = testCases[i];
        original = testCase.original;
        expected = testCase.expected;
        received = operation(original.text, original.cursor);
        if (received.text != expected.text || (withCursor &&
            received.cursor != expected.cursor)) {
          print('failed');
          showText('original', original.text, original.cursor);
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
  }


  /* formatter implements the operations specified by the Test object
     without altering the cursor position. */
  formatter = {};

  /* commatize takes a string of digits and commas. It adjusts commas so
     that they separate the digits into groups of three. */
  formatter.commatize = function (s, cursor) {
    var start,
        groups,
        i;
    s = s.replace(/,/g, '');
    start = s.length % 3 || 3;
    groups = [ s.substring(0, start) ];
    for (i = start; i < s.length; i += 3) {
      groups.push(s.substring(i, i + 3));
    }
    s = groups.join(',');
    return { text: s, cursor: cursor };
  };

  /* trimify removes spaces from the beginning and end of the string, and
     reduces each internal whitespace sequence to a single space. */
  formatter.trimify = function (s, cursor) {
    s = s.replace(/^\s+|\s+$/g, '');
    s = s.replace(/\s+/g, ' ');
    return { text: s, cursor: cursor };
  };


  // Utilities.

  function count(s, sub) {
    var count = 0,
        searchedTo = -1;
    while ((searchedTo = s.indexOf(sub, searchedTo + 1)) != -1) {
      ++count;
    }
    return count;
  }

  function chooseCursorChar(s) {
    var usedChars = {},
        seekChars = '|^_#',
        i, ch, code;
    for (i = 0; i < s.length; ++i) {
      usedChars[s.charAt(i)] = true;
    }
    for (i = 0; i < seekChars.length; ++i) {
      ch = seekChars.charAt(i);
      if (!(ch in usedChars)) {
        return ch;
      }
    }
    for (code = 32; code < 127; ++code) {
      ch = String.fromCharCode(code);
      if (!(ch in usedChars)) {
        return ch;
      }
    }
    return null;
  }


  numericalCursorFormatter = {};

  numericalCursorFormatter.commatize = function (s, cursor) {
    var pos, ch,
        leftDigitCount = cursor - count(s.substring(0, cursor), ',');
    s = formatter.commatize(s).text;
    if (leftDigitCount == 0) {
      return { text: s, cursor: 0 };
    }
    for (pos = 0; pos < s.length; ++pos) {
      ch = s.charAt(pos);
      if (ch != ',') {
        if (--leftDigitCount == 0) {
          break;
        }
      }
    }
    cursor = pos + 1;
    return { text: s, cursor: cursor };
  };

  numericalCursorFormatter.trimify = function (s, cursor) {
    var leftTrimmed = formatter.trimify(s.substring(0, cursor) + '|').text;
    s = formatter.trimify(s).text;
    cursor = Math.min(s.length, leftTrimmed.length - 1);
    return { text: s, cursor: cursor };
  };


  textualCursorFormatter = {};

  textualCursorFormatter.commatize = function (s, cursor) {
    var cursorChar = chooseCursorChar(s),
        groups = [],
        groupChars = [],
        digitCount = 0,
        i, ch;
    s = s.substring(0, cursor) + cursorChar + s.substring(cursor);
    for (i = s.length - 1; i >= 0; --i) {
      ch = s.charAt(i);
      if (ch != ',') {
        groupChars.push(ch);
        if (ch != cursorChar) {
          if (++digitCount == 3) {
            groups.push(groupChars.reverse().join(''));
            groupChars = [];
            digitCount = 0;
          }
        }
      }
    }
    if (groupChars.length > 0) {
      groups.push(groupChars.reverse().join(''));
    }
    s = groups.reverse().join(',');
    cursor = s.indexOf(cursorChar);
    s = s.replace(cursorChar, '');
    return { text: s, cursor: cursor };
  };

  textualCursorFormatter.trimify = function (s, cursor) {
    var cursorChar = chooseCursorChar(s);
    s = s.substring(0, cursor) + cursorChar + s.substring(cursor);
    s = formatter.trimify(s).text;
    s = s.replace(' ' + cursorChar + ' ', ' ' + cursorChar);
    if (s.charAt(0) == cursorChar) {
      s = s.replace(cursorChar + ' ', cursorChar);
    } else if (s.charAt(s.length - 1) == cursorChar) {
      s = s.replace(' ' + cursorChar, cursorChar);
    }
    cursor = s.indexOf(cursorChar);
    s = s.replace(cursorChar, '');
    return { text: s, cursor: cursor };
  };


  function TextWithCursor(text, cursor) {
    this.text = text || '';
    this.cursor = cursor || 0;
  }

  TextWithCursor.prototype.read = function (begin, length) {
    if (length === undefined) {
      length = 1;
    }
    return this.text.substring(begin, begin + length);
  };

  TextWithCursor.prototype.insert = function (begin, subtext) {
    this.text = this.text.substring(0, begin) + subtext +
        this.text.substring(begin);
    if (this.cursor > begin) {
      this.cursor += subtext.length;
    }
  };

  TextWithCursor.prototype.delete = function (begin, length) {
    if (length === undefined) {
      length = 1;
    }
    this.text = this.text.substring(0, begin) +
        this.text.substring(begin + length);
    if (this.cursor > begin) {
      this.cursor -= Math.min(this.cursor - begin, length);
    }
  };

  TextWithCursor.prototype.length = function () {
    return this.text.length;
  };

  TextWithCursor.prototype.append = function (subtext) {
    this.insert(this.length(), subtext);
  };

  TextWithCursor.prototype.display = function () {
    var parts = [],
        i;
    print(this.text);
    for (i = 0; i < this.cursor; ++i) {
      parts.push(' ');
    }
    parts.push('↖');
    print(parts.join(''));
  };


  metaCursorFormatter = {};

  metaCursorFormatter.commatize = function (s, cursor) {
    var t = new TextWithCursor(s, cursor),
        digitCount = 0,
        pos;
    for (pos = t.length() - 1; pos >= 0; --pos) {
      if (t.read(pos) == ',') {
        t.delete(pos);
      } else if (digitCount < 2) {
        ++digitCount;
      } else if (pos > 0) {
        t.insert(pos, ',');
        digitCount = 0;
      }
    }
    return t;
  };

  metaCursorFormatter.trimify = function (s, cursor) {
    var t = new TextWithCursor(s, cursor),
        spaceCount = 0,
        pos;
    for (pos = t.length() - 1; pos >= 0; --pos) {
      if (t.read(pos) != ' ') {
        spaceCount = 0;
      } else if (spaceCount == 0) {
        spaceCount = 1;
      } else {
        t.delete(pos + 1);
      }
    }
    [ t.length() - 1, 0 ].forEach(function (pos) {
      if (t.read(pos) == ' ') {
        t.delete(pos);
      }
    });
    return t;
  };


  function levenshtein(s, t) {
    var n = s.length,
        m = t.length,
        current,
        previous,
        temp,
        i, j;
    if (Math.min(n, m) == 0) {
      return Math.max(n, m);
    }
    current = new Array(m + 1);
    for (i = 0; i <= m; ++i) {
      current[i] = i;
    }
    previous = new Array(m + 1);
    for (i = 1; i <= n; ++i) {
      temp = current;
      current = previous;
      previous = temp;
      current[0] = previous[0] + 1;
      for (j = 1; j <= m; ++j) {
        if (t.charAt(j - 1) == s.charAt(i - 1)) {
          current[j] = previous[j - 1];
        } else {
          current[j] = Math.min(previous[j - 1] + 1,
                                previous[j] + 1,
                                current[j - 1] + 1);
        }
      }
    }
    return current[m];
  }

  function splitLevenshtein(s, sCursor, t, tCursor) {
    var cursorChar = chooseCursorChar(s + t),
        left = levenshtein(s.substring(0, sCursor), t.substring(0, tCursor)),
        right = levenshtein(s.substring(sCursor), t.substring(tCursor));
    return left + right;
  }


  function getCounts(s, chars) {
    var counts = {},
        i, ch;
    for (i = 0; i < chars.length; ++i) {
      counts[chars[i]] = 0;
    }
    for (i = 0; i < s.length; ++i) {
      ch = s.charAt(i);
      if (ch in counts) {
        counts[ch] += 1;
      }
    }
    return counts;
  }

  function leftRightCounts(s, cursor, chars) {
    var countLeft = getCounts(s.substring(0, cursor), chars),
        countRight = getCounts(s.substring(cursor), chars);
    return { left: countLeft, right: countRight };
  }

  function getCommonChars(s, t) {
    var sCharSet = {},
        tCharSet = {},
        chars = [],
        i;
    for (i = 0; i < s.length; ++i) {
      sCharSet[s.charAt(i)] = true;
    }
    for (i = 0; i < t.length; ++i) {
      tCharSet[t.charAt(i)] = true;
    }
    Object.keys(sCharSet).forEach(function (ch) {
      if (ch in tCharSet) {
        chars.push(ch);
      }
    });
    return chars;
  }

  function balanceFrequencies(s, sCursor, t, tCursor) {
    var chars = getCommonChars(s, t),
        sCounts = leftRightCounts(s, sCursor, chars),
        tCounts = leftRightCounts(t, tCursor, chars),
        cost = 0,
        i, ch, a, b;
    for (i = 0; i < chars.length; ++i) {
      ch = chars[i];
      a = sCounts.left[ch] / (sCounts.left[ch] + sCounts.right[ch]);
      b = tCounts.left[ch] / (tCounts.left[ch] + tCounts.right[ch]);
      cost += Math.pow(Math.abs(a - b), 2);
    }
    return cost;
  }

  retrospectiveCursorFormatter = {
    getDistance: balanceFrequencies
  };

  retrospectiveCursorFormatter.adjustCursor = function (original, cursor,
      formatter) {
    var formatted = formatter(original).text,
        cursorChar = chooseCursorChar(original + formatted),
        getDistance = this.getDistance,
        bestCost = getDistance(original, cursor, formatted, 0),
        bestPos = 0,
        cost,
        pos;
    //print(original.substring(0, cursor) + '^' + original.substring(cursor));
    //print('  ^' + formatted + ' ' + bestCost);
    for (pos = 1; pos <= formatted.length; ++pos) {
      cost = getDistance(original, cursor, formatted, pos);
      //print('  ' + formatted.substring(0, pos) + '^' +
      //    formatted.substring(pos) + ' ' + bestCost);
      if (cost < bestCost) {
        bestCost = cost;
        bestPos = pos;
      }
    }
    return { text: formatted, cursor: bestPos };
  };

  retrospectiveCursorFormatter.commatize = function (original, cursor) {
    return this.adjustCursor(original, cursor, formatter.commatize);
  };

  retrospectiveCursorFormatter.trimify = function (original, cursor) {
    return this.adjustCursor(original, cursor, formatter.trimify);
  };


  if (typeof print === 'undefined') {
    global.print = console.log;
  }


  test = new Test(numericalCursorFormatter);
  test.run();
  //(new Test()).display('commatize', false);
})();
