var CursorMaintainer = (function () {
  'use strict';

  var format,
      adHoc,
      mockCursor,
      meta,
      retro;


  //--- Plain formatting operations: no alteration of the cursor position.
  format = {};

  /* commatize takes a string of digits and commas. It adjusts commas so
     that they separate the digits into groups of three. */
  format.commatize = function (s, cursor) {
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

  /* trimify removes all whitespace from the beginning of the string and
     reduces other whitespace sequences to a single space each. */
  format.trimify = function (s, cursor) {
    s = s.replace(/^\s+/, '');
    s = s.replace(/\s+/g, ' ');
    return { text: s, cursor: cursor };
  };


  //--- Ad hoc: idiosyncratic cursor calculations.
  adHoc = {};

  /* count returns the number of occurrences (possibly overlapping) of the
     string sub in the string s. */
  function count(s, sub) {
    var count = 0,
        searchedTo = -1;
    while ((searchedTo = s.indexOf(sub, searchedTo + 1)) != -1) {
      ++count;
    }
    return count;
  }

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

  adHoc.trimify = function (s, cursor) {
    var leftTrimmed = format.trimify(s.substring(0, cursor) + '|').text;
    s = format.trimify(s).text;
    cursor = Math.min(s.length, leftTrimmed.length - 1);
    return { text: s, cursor: cursor };
  };


  //--- Mock cursor: incorporate the cursor into the text, format, fix.
  mockCursor = {};

  /* chooseCursorChar tests a set of favored characters, then all printable
     ASCII characters, until it finds one that does not occur in the text. */
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

  mockCursor.commatize = function (s, cursor) {
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

  mockCursor.trimify = function (s, cursor) {
    var cursorChar = chooseCursorChar(s);
    s = s.substring(0, cursor) + cursorChar + s.substring(cursor);
    s = format.trimify(s).text;
    s = s.replace(' ' + cursorChar + ' ', ' ' + cursorChar);
    if (s.charAt(0) == cursorChar) {
      s = s.replace(cursorChar + ' ', cursorChar);
    }
    cursor = s.indexOf(cursorChar);
    s = s.replace(cursorChar, '');
    return { text: s, cursor: cursor };
  };


  //--- Meta: local operations on a text-with-cursor object.
  meta = {};

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

  meta.commatize = function (s, cursor) {
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
      t.delete(pos);
    }
    return t;
  };


  //--- Retrospective: compare the old text and cursor to the new text.
  retro = {};

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

  function cursorLevenshtein(s, sCursor, t, tCursor) {
    var cursorChar = chooseCursorChar(s + t);
    s = s.substring(0, sCursor) + cursorChar + s.substring(sCursor);
    t = t.substring(0, tCursor) + cursorChar + t.substring(tCursor);
    return levenshtein(s, t);
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

  function balancedFrequencies(s, sCursor, t, tCursor) {
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

  function makeRetrospective(costFunction, plainFormatter) {
    return function (original, cursor) {
      var formatted = plainFormatter(original).text,
          bestCost = costFunction(original, cursor, formatted, 0),
          bestPos = 0,
          cost,
          pos,
          scores = [ bestCost ];
      for (pos = 1; pos <= formatted.length; ++pos) {
        cost = costFunction(original, cursor, formatted, pos);
        if (cost < bestCost) {
          bestCost = cost;
          bestPos = pos;
        }
        scores.push(cost);
      }
      return { text: formatted, cursor: bestPos, scores: scores };
    };
  }

  retro.cursorLevenshtein = {
    commatize: makeRetrospective(cursorLevenshtein, format.commatize),
    trimify: makeRetrospective(cursorLevenshtein, format.trimify)
  };

  retro.splitLevenshtein = {
    commatize: makeRetrospective(splitLevenshtein, format.commatize),
    trimify: makeRetrospective(splitLevenshtein, format.trimify)
  };

  retro.balancedFrequencies = {
    commatize: makeRetrospective(balancedFrequencies, format.commatize),
    trimify: makeRetrospective(balancedFrequencies, format.trimify)
  };


  return {
    format: format,
    adHoc: adHoc,
    mockCursor: mockCursor,
    meta: meta,
    retro: retro
  };
})();
