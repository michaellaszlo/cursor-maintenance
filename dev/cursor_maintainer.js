var CursorMaintainer = (function () {
  'use strict';

  var format,
      adHoc,
      mockCursor,
      meta,
      retrospective,
      layer;


  //--- Plain formatting operations. No cursor involved.

  /* commatize takes a string of digits and commas. It adjusts commas so
     that they separate the digits into groups of three. */
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

  /* trimify removes all whitespace from the beginning of the string and
     reduces other whitespace sequences to a single space each. */
  function trimify(s) {          // s is an arbitrary string.
    s = s.replace(/^\s+/, '');   // Remove whitespace from the beginning.
    s = s.replace(/\s+/g, ' ');  // Condense remaining whitespace sequences
    return s;                    //  to one space each.
  };


  //--- Plain formatting operations wrapped for testing: cursor unchanged.
  format = {};

  format.commatize = function (s, cursor) {
    return { text: commatize(s), cursor: cursor };
  };

  format.trimify = function (s, cursor) {
    return { text: trimify(s), cursor: cursor };
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


  //--- Retrospective: compare the old text and cursor to the new text.
  retrospective = {};

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

  function costSplitLevenshtein(s, sCursor, t, tCursor) {
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

  function costBalancedFrequencies(s, sCursor, t, tCursor) {
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

  retrospective.make = function (format, costFunction) {
    return function (original, cursor) {
      var formatted = format(original).text,
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

  retrospective.splitLevenshtein = {
    commatize: retrospective.make(format.commatize, costSplitLevenshtein),
    trimify: retrospective.make(format.trimify, costSplitLevenshtein)
  };

  retrospective.balancedFrequencies = {
    commatize: retrospective.make(format.commatize, costBalancedFrequencies),
    trimify: retrospective.make(format.trimify, costBalancedFrequencies)
  };


  //--- Layer: seek the closest cursor ratio in a subset of characters.
  layer = {};

  layer.make = function (format, testers, preferRight) {
    return function (original, cursor) {
      var originalCount, originalTotal, originalRatio,
          formattedCounts, formattedTotal, formattedRatio,
          delta, bestDelta, bestFormattedRatio,
          rank, tester, pos,
          bestLeft, bestRight,
          formatted = format(original).text,
          left = 0,
          right = formatted.length;
      if (right == 0) {
        return { text: '', cursor: 0 };
      }
      for (rank = 0; rank < testers.length; ++rank) {
        tester = testers[rank];
        // Scan the original text, counting current layer characters.
        originalCount = 0;
        originalTotal = 0;
        for (pos = 0; pos < original.length; ++pos) {
          if (tester.test(original.charAt(pos))) {
            ++originalTotal;
            // We only need the ratio for the original cursor position.
            if (pos < cursor) {
              ++originalCount;
            }
          }
        }
        //print();
        //print(original, '->', formatted);
        //print('original:', originalCount, '/', originalTotal);
        // Bail out if the original text has no layer characters.
        if (originalTotal == 0) {
          continue;
        }
        // Compute the original cursor's ratio in the current layer.
        originalRatio = originalCount / originalTotal;
        // Scan the formatted text and store the layer count at each position.
        formattedCounts = new Array(formatted.length + 1);
        formattedCounts[0] = 0;
        formattedTotal = 0;
        for (pos = 0; pos < formatted.length; ++pos) {
          if (tester.test(formatted.charAt(pos))) {
            ++formattedTotal;
          }
          formattedCounts[pos + 1] = formattedTotal;
        }
        // Bail out if the formatted text has no layer characters.
        if (formattedTotal == 0) {
          continue;
        }
        // Scan the layer counts to compute the ratio at each cursor position.
        // Keep track of the closest ratio and the indices where it occurs.
        bestFormattedRatio = formattedCounts[left] / formattedTotal;
        bestDelta = Math.abs(originalRatio - bestFormattedRatio);
        bestLeft = bestRight = left;
        for (pos = left + 1; pos <= right; ++pos) {
          formattedRatio = formattedCounts[pos] / formattedTotal;
          delta = Math.abs(originalRatio - formattedRatio);
          if (delta == bestDelta) {
            bestRight = pos;
          } else if (delta < bestDelta) {
            bestFormattedRatio = formattedRatio;
            bestDelta = delta;
            bestLeft = bestRight = pos;
          }
        }
        //print('originalRatio', originalRatio);
        //print('bestFormattedRatio', bestFormattedRatio);
        //print('[' + bestLeft + ', ' + bestRight + ']');
        if (bestLeft == bestRight) {
          break;
        }
        // If there is a tie shrink the range for the next layer.
        left = bestLeft;
        right = bestRight;
      }
      if (preferRight) {
        return { text: formatted, cursor: bestRight };
      }
      return { text: formatted, cursor: bestLeft };
    };
  }

  layer.commatize = layer.make(format.commatize, [ /\d/ ]);

  layer.trimify = layer.make(format.trimify, [ /\S/ ], true);


  return {
    format: format,
    adHoc: adHoc,
    mockCursor: mockCursor,
    meta: meta,
    splitLevenshtein: retrospective.splitLevenshtein,
    balancedFrequencies: retrospective.balancedFrequencies,
    costBalancedFrequencies: costBalancedFrequencies,
    retrospective: retrospective,
    layer: layer
  };
})();
