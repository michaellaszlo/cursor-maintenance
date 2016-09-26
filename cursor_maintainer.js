var CursorMaintainer = (function () {
  'use strict';

  // The CursorMaintainer module supports three cursor-maintenance approaches:
  //  layer, retrospective, and meta.

  var layer,           // A statistical approach configured per format.
      retrospective,   // Format-independent statistical cursor maintenance.
      costFunctions,   // Cost functions for the retrospective approach.
      TextWithCursor;  // Support for the meta approach.


  //--- Layer approach: A statistical approach that looks at layers of text
  //  induced by the character sets specified for a format. Within each layer
  //  of formatted text, we seek the position where the ratio of characters
  //  to the left of the cursor is closest to the equivalent proportion at
  //  the cursor position in the raw text. If several cursor positions are
  //  equally close, we move to the next layer. If a tie-breaker is needed,
  //  we take either the left or right end of the final range, as configured
  //  for the format. 

  layer = {};

  // layer.makeMaintainer returns a function that takes an instance of the
  //  cursor-maintenance problem and returns an object containing the
  //  cursor position computed by the layer approach. The resulting cursor
  //  maintainer does not check for equality of the formatted text and
  //  raw text. The caller should perform this check and only call the
  //  cursor maintainer if the formatted text differs from the raw text.
  // testers: An array of objects, each with a test() method that takes a
  //  character and returns a Boolean value. A regex is such an object.
  // preferRight: A Boolean value. If this argument is omitted, ties are
  //  broken to the left, i.e., preferRight is false by default.
  layer.makeMaintainer = function (testers, preferRight) {
    return function (raw, cursor, formatted) {
      var rawCount, rawTotal, rawRatio,
          formattedCounts, formattedTotal, formattedRatio,
          delta, bestDelta, bestFormattedRatio,
          rank, tester, pos,
          left = 0,
          right = formatted.length,
          bestLeft = left, bestRight = right;
      if (right == 0) {
        return { text: '', cursor: 0 };
      }
      for (rank = 0; rank < testers.length; ++rank) {
        tester = testers[rank];
        // Scan the raw text, counting current layer characters.
        rawCount = 0;
        rawTotal = 0;
        for (pos = 0; pos < raw.length; ++pos) {
          if (tester.test(raw.charAt(pos))) {
            ++rawTotal;
            // We only need the ratio for the raw cursor position.
            if (pos < cursor) {
              ++rawCount;
            }
          }
        }
        // Bail out if the raw text has no layer characters.
        if (rawTotal == 0) {
          continue;
        }
        // Compute the raw cursor's ratio in the current layer.
        rawRatio = rawCount / rawTotal;
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
        bestDelta = Math.abs(rawRatio - bestFormattedRatio);
        bestLeft = bestRight = left;
        for (pos = left + 1; pos <= right; ++pos) {
          formattedRatio = formattedCounts[pos] / formattedTotal;
          delta = Math.abs(rawRatio - formattedRatio);
          if (delta == bestDelta) {
            bestRight = pos;
          } else if (delta < bestDelta) {
            bestFormattedRatio = formattedRatio;
            bestDelta = delta;
            bestLeft = bestRight = pos;
          }
        }
        if (bestLeft == bestRight) {
          break;
        }
        // If there is a tie, shrink the range for the next layer.
        left = bestLeft;
        right = bestRight;
      }
      if (preferRight) {
        return { cursor: bestRight };
      }
      return { cursor: bestLeft };
    };
  };

  // layer.augmentFormat returns a cursor-maintaining formatter based on a
  //  given format. A cursor-maintaining formatter takes raw text and a raw
  //  cursor position; it returns formatted text and a new cursor position.
  // format: A function that takes raw text and returns formatted text.
  // testers, preferRight: Arguments to layer.makeMaintainer.
  layer.augmentFormat = function (format, testers, preferRight) {
    var maintainer = layer.makeMaintainer(testers, preferRight);
    return function (raw, cursor) {
      var result,
          formatted = format(raw);
      // Check for equality to avoid calculating a new, possibly erroneous
      //  cursor position in the trivial case where formatted == raw.
      if (formatted == raw) {
        return { text: raw, cursor: cursor };
      }
      result = maintainer(raw, cursor, formatted);
      result.text = formatted;
      return result;
    };
  };


  //--- Retrospective approach: A statistical approach that is not configured
  //  for any particular format. Instead, we configure it with a cost function
  //  that computes a score for every position in the formatted text. The
  //  position with the lowest score is chosen as the new cursor position.
  //  If several positions are in a tie, the leftmost is chosen.

  costFunctions = {};
  retrospective = { costFunctions: costFunctions };

  // levenshtein implements the well-known Levenshtein distance. It is
  //  called by costFunctions.splitLevenshtein.
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

  // costFunctions.splitLevenshtein splits the raw text and formatted text
  //  at respective cursor positions, computes the Levenshtein distance
  //  between the left parts, then between the right parts, and takes the
  //  sum. The raw cursor position is passed to this function. It is compared
  //  to all positions in the formatted text, and the resulting scores
  //  are returned in an array.
  costFunctions.splitLevenshtein = function (s, sCursor, t) {
    var tCursor,
        left, right,
        scores = new Array(t.length + 1);
    for (tCursor = 0; tCursor <= t.length; ++tCursor) {
      left = levenshtein(s.substring(0, sCursor), t.substring(0, tCursor));
      right = levenshtein(s.substring(sCursor), t.substring(tCursor));
      scores[tCursor] = left + right;
    }
    return scores;
  };

  // getCommonChars finds the set of characters that appear in both of the
  //  given strings. It is called by costFunctions.frequencyRatios.
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

  // getLeftCounts is given an arbitrary string and an array containing a
  //  set of characters. It returns an array containing, for each position
  //  in the string, an object that maps each character in the set to the
  //  number of times the character appears to the left of the position.
  function getLeftCounts(s, chars) {
    var counts = new Array(s.length + 1),
        pos, i, ch;
    // Initialize all character frequencies to zero.
    counts[0] = {};
    for (i = 0; i < chars.length; ++i) {
      counts[0][chars[i]] = 0;
    }
    // Iterate over string positions, dealing with set characters in parallel.
    for (pos = 1; pos <= s.length; ++pos) {
      counts[pos] = {};
      // Copy the previous character frequencies.
      for (i = 0; i < chars.length; ++i) {
        counts[pos][chars[i]] = counts[pos - 1][chars[i]];
      }
      // Update the frequency of one character at the most.
      ch = s.charAt(pos - 1);
      if (ch in counts[pos]) {
        counts[pos][ch] += 1;
      }
    }
    return counts;
  }

  // costFunctions.frequencyRatios takes the set of characters that are
  //  common to the raw text and formatted text. At each position in the
  //  formatted text, for each character in the common set, it computes the
  //  square of the difference between the frequency ratios in the raw text
  //  and the formatted text at this position. The frequency ratio of a
  //  character at a position is the character's frequency to the left of
  //  the position divided by its overall frequency. The sum of the squared
  //  differences over the common characters is the score for a position.
  costFunctions.frequencyRatios = function (s, sCursor, t) {
    var chars = getCommonChars(s, t),
        sCounts = getLeftCounts(s, chars),
        // We have one set of raw counts because the raw cursor is fixed.
        sCountsHere = sCounts[sCursor],
        sTotals = sCounts[s.length],
        sRatios = new Array(chars.length),
        tCounts = getLeftCounts(t, chars),
        // The counts in the formatted text vary with the candidate cursor.
        tCountsHere,
        tTotals = tCounts[t.length],
        scores = new Array(t.length + 1),
        tCursor, i, ch, tRatio, cost;
    // Precompute the frequency ratios at the raw cursor position.
    for (i = 0; i < chars.length; ++i) {
      ch = chars[i];
      sRatios[ch] = sCountsHere[ch] / sTotals[ch];
    }
    for (tCursor = 0; tCursor <= t.length; ++tCursor) {
      // Look up the counts at the current position in the formatted text.
      tCountsHere = tCounts[tCursor];
      cost = 0;
      for (i = 0; i < chars.length; ++i) {
        ch = chars[i];
        tRatio = tCountsHere[ch] / tTotals[ch];
        cost += Math.pow(sRatios[ch] - tRatio, 2);
      }
      scores[tCursor] = cost;
    }
    return scores;
  };

  // retrospective.makeMaintainer returns a function that takes an instance
  //  of the cursor-maintenance problem and returns an object containing the
  //  cursor position computed by the retrospective approach. The resulting
  //  cursor maintainer does not check for equality of the formatted text
  //  and raw text. The caller should perform this check and only call the
  //  cursor maintainer if the formatted text differs from the raw text.
  // costFunction: A function that is given the raw text, raw cursor
  //  position, and formatted text. It computes an array of scores for
  //  every position in the formatted text. Lower scores indicate better
  //  cursor positions. This module has two built-in cost functions:
  //  costFunctions.splitLevenshtein and costFunctions.frequencyRatios.
  retrospective.makeMaintainer = function (costFunction) {
    if (costFunction === undefined) {
      costFunction = costFunctions.frequencyRatios;
    }
    return function (raw, cursor, formatted) {
      var cost, pos,
          scores = costFunction(raw, cursor, formatted),
          bestCost = scores[0],
          bestPos = 0;
      for (pos = 1; pos <= formatted.length; ++pos) {
        cost = scores[pos];
        if (cost < bestCost) {
          bestCost = cost;
          bestPos = pos;
        }
      }
      return { cursor: bestPos, scores: scores };
    };
  };

  // retrospective.augmentFormat returns a cursor-maintaining formatter
  //  based on a given format. A cursor-maintaining formatter takes raw text
  //  and a raw cursor position; it returns formatted text and a new cursor
  //  position.
  // format: A function that takes raw text and returns formatted text.
  // costFunction: the argument to retrospective.makeMaintainer.
  retrospective.augmentFormat = function (format, costFunction) {
    var maintainer;
    if (costFunction === undefined) {
      costFunction = costFunctions.frequencyRatios;
    }
    maintainer = retrospective.makeMaintainer(costFunction);
    return function (raw, cursor) {
      var result,
          formatted = format(raw);
      // Check for equality to avoid calculating a new, possibly erroneous
      //  cursor position in the trivial case where formatted == raw.
      // We add a zero-length score array to the result because functions
      //  returned by retrospective.makeMaintainer include scores in their
      //  return value.
      if (formatted == raw) {
        return { text: raw, cursor: cursor, scores: [] };
      }
      result = maintainer(raw, cursor, formatted);
      result.text = formatted;
      return result;
    };
  };


  //--- Meta approach: Wherein we reimplement the format with elementary
  //  operations on a text-with-cursor object. The elementary operations
  //  are read, insert, and delete. When an insert or delete operation is
  //  applied once, it moves the cursor in a straightforward manner. However,
  //  it is possible to apply a sequence of elementary operations that
  //  obfuscate the overall cursor movement, defeating cursor maintenance.
  //  Be wary of deleting large substrings that span the cursor, because
  //  that's how you lose cursor context. Try to delete the fewest possible
  //  characters to achieve the text transformation required by the format.

  // TextWithCursor constructs a text-with-cursor object.
  TextWithCursor = function (text, cursor) {
    this.text = text || '';
    this.cursor = cursor || 0;
  }

  // TextWithCursor.length is a shortcut for accessing the text length.
  TextWithCursor.prototype.length = function () {
    return this.text.length;
  };
   
  // TextCursor.read gets one character by default, several if specified.
  TextWithCursor.prototype.read = function (begin, length) {
    if (length === undefined) {
      length = 1;
    }
    if (length <= 0) {
      return;
    }
    return this.text.substring(begin, begin + length);
  };

  // TextWithCursor.insert adds text at the specified insertion point and
  //  shifts the cursor if needed. The cursor is unchanged if it is at or to
  //  the left of the insertion point.
  TextWithCursor.prototype.insert = function (begin, subtext) {
    this.text = this.text.substring(0, begin) + subtext +
        this.text.substring(begin);
    if (this.cursor > begin) {
      this.cursor += subtext.length;
    }
  };

  // TextWithCursor.delete removes one character by default, several if
  //  specified, then shifts the cursor if needed. The cursor is unchanged
  //  if it is at or to the left of the deleted characters.
  TextWithCursor.prototype.delete = function (begin, length) {
    if (length === undefined) {
      length = 1;
    }
    if (length <= 0) {
      return;
    }
    this.text = this.text.substring(0, begin) +
        this.text.substring(begin + length);
    if (this.cursor > begin) {
      this.cursor -= Math.min(this.cursor - begin, length);
    }
  };


  return {
    layer: layer,
    retrospective: retrospective,
    TextWithCursor: TextWithCursor
  };
})();
