var CursorMaintainerExperiments = (function () {
  'use strict';

  var CM = CursorMaintainer,
      TextWithCursor = CM.TextWithCursor;

  // This module defines two plain formatters and uses them as the basis for
  //  a collection of cursor-maintaining formatters using various approaches.
  //  A plain formatter is a function that takes raw text and returns
  //  formatted text. A cursor-maintaining formatter takes raw text and a raw
  //  cursor position; it returns formatted text and a new cursor position.

  var format,         // Plain formatters for demonstration and testing.
      adHoc,          // Reimplementation of formats with cursor maintenance.
      mockCursor,     // Ad hoc approach with the help of a mock cursor.
      meta,           // Reimplementation on a text-with-cursor object.
      retrospective,  // Format-independent statistical cursor maintenance.
      layer;          // A statistical approach configured per format.


  //--- Plain formatters: text transformations with no cursor. The same
  //  two formats, commatize and trimify, are used throughout this module
  //  as the basis for various approaches to cursor maintenance.

  // commatize takes a string of digits and commas. It arranges commas so
  //  that they separate the digits into groups of three. For example,
  //  "1,45,,00" gets commatized to "14,500".
  function commatize(s) {                    // s is a string composed of
    var start, groups, i;                    //  digits and commas.
    s = s.replace(/,/g, '');                 // Remove all commas.
    start = s.length % 3 || 3;               // Begin with 1, 2, or 3 digits.
    groups = [ s.substring(0, start) ];      // Make the first group of digits.
    for (i = start; i < s.length; i += 3) {
      groups.push(s.substring(i, i + 3));    // Add three-digit groups.
    }
    s = groups.join(',');                    // Insert commas between groups.
    return s;
  };

  // trimify removes all whitespace from the beginning of the string and
  //  reduces other whitespace sequences to a single space each. For example,
  //  "  Four score  and  seven  " gets trimified to "Four score and seven ".
  function trimify(s) {          // s is an arbitrary string.
    s = s.replace(/^\s+/, '');   // Remove whitespace from the beginning.
    s = s.replace(/\s+/g, ' ');  // Condense remaining whitespace sequences
    return s;                    //  to one space each.
  };


  //--- Wrapped versions of the plain formatters. These functions are
  //  interface-compatible with cursor-maintaining formatters, but they don't
  //  do cursor maintenance. They return the raw cursor position as is.

  format = {};

  format.commatize = function (s, cursor) {
    return { text: commatize(s), cursor: cursor };
  };

  format.trimify = function (s, cursor) {
    return { text: trimify(s), cursor: cursor };
  };


  //--- Ad hoc cursor maintenance: reimplement the format in such a way
  //  that we keep track of the cursor position while transforming the text.

  adHoc = {};

  // count returns the number of occurrences (possibly overlapping) of the
  //  string sub in the string s. It is called by adHoc.commatize.
  function count(s, sub) {
    var count = 0,
        searchedTo = -1;
    while ((searchedTo = s.indexOf(sub, searchedTo + 1)) != -1) {
      ++count;
    }
    return count;
  }

  // adHoc.commatize counts digits to the left of the cursor in the
  //  raw state, calls the plain commatizer, then counts off the same
  //  number of digits in the commatized text.
  adHoc.commatize = function (s, cursor) {
    var pos, ch,
        leftDigitCount = cursor - count(s.substring(0, cursor), ',');
    s = format.commatize(s).text;
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

  // adHoc.trimify appends a non-space character to the left part of the
  //  raw text and trimifies it. This gives us the new cursor position
  //  unless the entire trimified text ends up shorter than the trimified
  //  left part, which happens when the cursor is among space characters
  //  at the right end of the text.
  adHoc.trimify = function (s, cursor) {
    var leftTrimmed = format.trimify(s.substring(0, cursor) + '|').text;
    s = format.trimify(s).text;
    cursor = Math.min(s.length, leftTrimmed.length - 1);
    return { text: s, cursor: cursor };
  };


  //--- Mock cursor: incorporate the cursor into the text, format, fix.

  mockCursor = {};

  // chooseCursorChar tests a set of favored characters, then all printable
  //  ASCII characters, until it finds one that does not occur in the text.
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

  function makeMockCursor(format) {
    return function (s, cursor) {
      var cursorChar = chooseCursorChar(s),
          t = s.substring(0, cursor) + cursorChar + s.substring(cursor),
          formatted = format(t, cursorChar),
          cursor = formatted.indexOf(cursorChar),
          text = formatted.replace(cursorChar, '');
      return { text: text, cursor: cursor };
    };
  }

  mockCursor.commatize = makeMockCursor(function (s, cursorChar) {
    var groups = [],
        groupChars = [],
        digitCount = 0,
        i, ch;
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
    if (s.charAt(0) == cursorChar && s.charAt(1) == ',') {
      s = cursorChar + s.substring(2);
    }
    return s;
  });

  mockCursor.trimify = makeMockCursor(function (s, cursorChar) {
    s = format.trimify(s).text;
    if (s.charAt(0) == cursorChar) {
      s = s.replace(cursorChar + ' ', cursorChar);
    } else {
      s = s.replace(' ' + cursorChar + ' ', ' ' + cursorChar);
    }
    return s;
  });


  //--- Meta: local operations on a text-with-cursor object.

  meta = {};

  meta.commatize = function (s, cursor) {
    var t = new TextWithCursor(s, cursor),
        digitCount = 0,
        pos;
    for (pos = t.length() - 1; pos >= 0; --pos) {
      if (t.read(pos) == ',') {
        t.delete(pos);
      } else if (digitCount == 3) {
        t.insert(pos + 1, ',');
        digitCount = 1;
      } else {
        ++digitCount;
      }
    }
    return t;
  };

  meta.trimify = function (s, cursor) {
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
    if (t.read(0) == ' ') {
      t.delete(0);
    }
    return t;
  };


  //--- Retrospective: compare the raw text and cursor to the formatted text.

  retrospective = {};

  [ 'splitLevenshtein', 'frequencyRatios' ].forEach(function (name) {
    var costFunction = CM.retrospective.costFunctions[name];
    retrospective[name] = {
      commatize: CM.retrospective.augmentFormat(commatize, costFunction),
      trimify: CM.retrospective.augmentFormat(trimify, costFunction)
    };
  });


  //--- Layer: seek the closest frequency ratio for a character set.

  layer = {};

  layer.commatize = CM.layer.augmentFormat(commatize, [ /\d/ ]);

  layer.trimify = CM.layer.augmentFormat(trimify, [ /\S/ ], true);


  return {
    format: format,
    adHoc: adHoc,
    mockCursor: mockCursor,
    meta: meta,
    retrospective: retrospective,
    splitLevenshtein: retrospective.splitLevenshtein,
    frequencyRatios: retrospective.frequencyRatios,
    layer: layer
  };
})();
