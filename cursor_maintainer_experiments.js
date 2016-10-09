var CursorMaintainerExperiments = (function () {
  'use strict';

  // requires: cursor_maintainer.js

  // The CursorMaintainerExperiments module defines two plain formatters and
  //  uses them as the basis for a collection of cursor-maintaining formatters
  //  using various approaches. A plain formatter is a function that takes raw
  //  text and returns formatted text. A cursor-maintaining formatter takes
  //  raw text and a cursor position in the raw text; it returns formatted
  //  text and a new cursor position.

  var CM = CursorMaintainer,
      format,         // Plain formatters for demonstration and testing.
      adHoc,          // Reimplementation of formats with cursor maintenance.
      mockCursor,     // Ad hoc approach with the help of a mock cursor.
      meta,           // Reimplementation on a text-with-cursor object.
      retrospective,  // Format-independent statistical cursor maintenance.
      layer;          // A statistical approach configured per format.


  //--- Plain formatters: Text transformations with no cursor. The same
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

  function creditCard(s) {
    var groups = [],
        i;
    s = s.replace(/\D/g, '');            // Remove all non-digit characters.
    s = s.substring(0, 16);              // Keep no more than 16 digits.
    for (i = 0; i < s.length; i += 4) {  // Make four-digit groups.
      groups.push(s.substring(i, i + 4));
    }
    return groups.join(' ');             // Put spaces between the groups.
  }


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


  //--- Ad hoc cursor maintenance: Reimplementing the format in such a way
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
  //  unless the entire trimified text ends up shorter, which will happen
  //  when the cursor is among space characters at the right end of the text.
  adHoc.trimify = function (s, cursor) {
    var leftTrimmed = format.trimify(s.substring(0, cursor) + '|').text;
    s = format.trimify(s).text;
    cursor = Math.min(s.length, leftTrimmed.length - 1);
    return { text: s, cursor: cursor };
  };


  //--- Mock cursor: A variation on the ad hoc approach in which we insert a
  //  special character into the raw text at the cursor position. We then
  //  reimplement the format in such a way that this special character, the
  //  mock cursor, is preserved while we transform the text around it.
  //  Afterward, the mock cursor is removed from the text and its final
  //  position is returned as the new cursor position.

  mockCursor = {};

  // chooseCursorChar returns a printable ASCII character (numbers 32 through
  //  126) that does not occur in the given text. If all printable characters
  //  occur, the return value is null. chooseCursorChar is called by
  //  mockCursor.augment.
  function chooseCursorChar(s) {
    var usedChars = {},
        seekChars = '|^_#',  // Try these first because we like them best.
        i, ch, code;
    for (i = 0; i < s.length; ++i) {
      usedChars[s.charAt(i)] = true;
    }
    // Try our favorite characters.
    for (i = 0; i < seekChars.length; ++i) {
      ch = seekChars.charAt(i);
      if (!(ch in usedChars)) {
        return ch;
      }
    }
    // Try all printable ASCII characters.
    for (code = 32; code <= 126; ++code) {
      ch = String.fromCharCode(code);
      if (!(ch in usedChars)) {
        return ch;
      }
    }
    return null;
  }

  // mockCursor.augment takes a formatter that works on text with a mock
  //  cursor, and returns a cursor-maintaining formatter that uses the
  //  mock-cursor approach. In other words, mockCursor.augment handles the
  //  routine work of inserting the mock cursor prior to formatting and
  //  removing it afterward. The real work of formatting text with a mock
  //  cursor is done by the input function, which takes two arguments:
  //  the first is the raw text, the second is the character representing
  //  the mock cursor; the return value is the formatted text.
  mockCursor.augment = function (format) {
    return function (s, cursor) {
      var cursorChar = chooseCursorChar(s),
          t = s.substring(0, cursor) + cursorChar + s.substring(cursor),
          formatted = format(t, cursorChar),
          cursor = formatted.indexOf(cursorChar),
          text = formatted.replace(cursorChar, '');
      return { text: text, cursor: cursor };
    };
  }

  // mockCursor.commatize scans the raw text from right to left, skipping
  //  commas and counting digits. Groups of non-comma characters that include
  //  three digits are joined with commas. The leftmost character in such a
  //  group is always a digit, so the cursor can never be the right-hand
  //  neighbor of a comma. If the cursor is between digit groups, it must be
  //  to the left of the comma.
  mockCursor.commatize = mockCursor.augment(function (s, cursorChar) {
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
            // Reverse the group to put the digits in left-to-right order.
            groups.push(groupChars.reverse().join(''));
            groupChars = [];
            digitCount = 0;
          }
        }
      }
    }
    // There may be one or two digits left over in the final group.
    if (groupChars.length > 0) {
      groups.push(groupChars.reverse().join(''));
    }
    s = groups.reverse().join(',');
    // If the mock cursor ended up on its own in the final group, we
    //  have a spurious comma. Check for this case and delete the comma.
    if (s.charAt(0) == cursorChar && s.charAt(1) == ',') {
      s = cursorChar + s.substring(2);
    }
    return s;
  });

  // mockCursor.trimify calls the plain trimifier on the raw text, then
  //  fixes the formatting around the mock cursor. There are two cases
  //  to check for: either the mock cursor is the leftmost character and has
  //  a space to its right, or it is between exactly two spaces.
  mockCursor.trimify = mockCursor.augment(function (s, cursorChar) {
    s = format.trimify(s).text;
    if (s.charAt(0) == cursorChar) {
      s = s.replace(cursorChar + ' ', cursorChar);
    } else {
      s = s.replace(' ' + cursorChar + ' ', ' ' + cursorChar);
    }
    return s;
  });


  //--- Meta approach: We reimplement the format with elementary operations
  //  (length, read, insert, delete) on a text-with-cursor object. The
  //  CursorMaintainer module defines TextWithCursor for this purpose. Each
  //  elementary operation has a predictable effect on the cursor. We want
  //  to keep these effects in mind as we implement the formatter so that
  //  we control the overall movement of the cursor and make it predictable
  //  to the end user, too.

  meta = {};

  // meta.commatize scans the raw text from right to left, deleting commas
  //  and counting digits. If we come upon a digit when we have already
  //  counted three digits, we insert a comma to the right of this digit
  //  and set the digit count to one.
  meta.commatize = function (s, cursor) {
    var t = new CM.TextWithCursor(s, cursor),
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

  // meta.trimify scans the raw text from right to left, deleting every
  //  space except the leftmost space in each contiguous space sequence.
  //  Finally, if the leftmost character is a space, it is deleted.
  meta.trimify = function (s, cursor) {
    var t = new CM.TextWithCursor(s, cursor),
        spaceCount = 0,
        pos;
    for (pos = t.length() - 1; pos >= 0; --pos) {
      if (t.read(pos) != ' ') {
        spaceCount = 0;     // We are not in a space sequence.
      } else if (spaceCount == 0) {
        spaceCount = 1;     // We are at the rightmost space in a sequence.
      } else {
        t.delete(pos + 1);  // There is a space to the right; delete it.
      }
    }
    if (t.read(0) == ' ') {
      t.delete(0);  // Check for a single space remaining at the left end.
    }
    return t;
  };

  meta.creditCard = function (s, cursor) {
    var t = new CM.TextWithCursor(s, cursor),
        pos, start;
    for (pos = t.length() - 1; pos >= 0; --pos) {
      if (!/\d/.test(t.read(pos))) {  // Remove all non-digit characters.
        t.delete(pos);
      }
    }
    while (t.length() > 16) {         // Keep no more than 16 digits.
      t.delete(t.length() - 1);
    }
    start = Math.min(12, t.length() - t.length() % 4);
    for (pos = start; pos > 0; pos -= 4) {
      t.insert(pos, ' ');             // Put spaces between four-digit groups.
    }
    return t;
  };


  //--- Retrospective approach: An open-ended statistical approach that
  //  relies on a cost function. The CursorMaintainer module defines a
  //  retrospective format augmenter and two cost functions, which we use
  //  here to instantiate cursor-maintaining formatters for commatize and
  //  trimify.

  retrospective = {};

  [ 'splitLevenshtein', 'frequencyRatios' ].forEach(function (name) {
    var costFunction = CM.retrospective.costFunctions[name];
    retrospective[name] = {
      commatize: CM.retrospective.augmentFormat(commatize, costFunction),
      trimify: CM.retrospective.augmentFormat(trimify, costFunction),
      creditCard: CM.retrospective.augmentFormat(creditCard, costFunction)
    };
  });

  //  The retrospective.splitLevenshtein and retrospective.frequencyRatios
  //  objects each contain cursor-maintaining formatters for commatize and
  //  trimify. Thus, they have the same interface as format, adHoc,
  //  mockCursor, meta, and layer.


  //--- Layer approach: A statistical approach that scans text layers induced
  //  by character sets. To configure this approach for a format, we define
  //  a sequence of character sets and optionally specify whether ties should
  //  should be broken by choosing the leftmost or rightmost candidate (the
  //  default is leftmost). Here we build cursor-maintaining formatters for
  //  commatize and trimify using the layer facilities of CursorMaintainer.

  layer = {};

  layer.commatize = CM.layer.augmentFormat(commatize, [ /\d/ ]);

  layer.trimify = CM.layer.augmentFormat(trimify, [ /\S/ ], true);

  layer.creditCard = CM.layer.augmentFormat(creditCard, [ /\d/ ]);

  return {
    format: format,
    adHoc: adHoc,
    mockCursor: mockCursor,
    meta: meta,
    splitLevenshtein: retrospective.splitLevenshtein,
    frequencyRatios: retrospective.frequencyRatios,
    layer: layer
  };
})();
