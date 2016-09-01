var CursorMaintainer = (function () {
  'use strict';

  var layer,          // A statistical approach configured per format.
      retrospective,  // Format-independent statistical cursor maintenance.
      costFunctions;  // Cost functions for the retrospective approach.


  //--- Meta approach: requires reimplementation of the format with
  //  elementary operations on a text-with-cursor object.

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


  //--- Layer approach: a statistical approach that looks at layers of text
  //  induced by character sets specified for a format.

  layer = {};

  layer.augmentFormat = function (format, testers, preferRight) {
    return function (raw, cursor) {
      var rawCount, rawTotal, rawRatio,
          formattedCounts, formattedTotal, formattedRatio,
          delta, bestDelta, bestFormattedRatio,
          rank, tester, pos,
          formatted = format(raw).text,
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
        return { text: formatted, cursor: bestRight };
      }
      return { text: formatted, cursor: bestLeft };
    };
  };


  //--- Retrospective approach: a format-independent statistical approach
  //  to cursor maintenance.

  costFunctions = {};
  retrospective = { costFunctions: costFunctions };

  // levenshtein implements the well-known Levenshtein distance. We use
  //  it in our "split Levenshtein" retrospective formula.
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

  // splitLevenshtein splits the raw text and formatted text at respective
  //  cursor positions, computes the Levenshtein distance between the
  //  left parts, then between the right parts, and takes the sum.
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

  // getCommonChars is used by frequencyRatios. Given two strings, it finds
  //  the set of characters that appear in both.
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

  function getLeftCounts(s, chars) {
    var counts = new Array(s.length + 1),
        pos, i, ch;
    counts[0] = {};
    for (i = 0; i < chars.length; ++i) {
      counts[0][chars[i]] = 0;
    }
    for (pos = 1; pos <= s.length; ++pos) {
      counts[pos] = {};
      for (i = 0; i < chars.length; ++i) {
        counts[pos][chars[i]] = counts[pos - 1][chars[i]];
      }
      ch = s.charAt(pos - 1);
      if (ch in counts[pos]) {
        counts[pos][ch] += 1;
      }
    }
    return counts;
  }

  costFunctions.frequencyRatios = function (s, sCursor, t) {
    var chars = getCommonChars(s, t),
        sCounts = getLeftCounts(s, chars),
        sCountsHere = sCounts[sCursor],  // the raw cursor is fixed
        sTotals = sCounts[s.length],
        tCounts = getLeftCounts(t, chars),
        tCountsHere,  // we'll examine each position in the formatted text
        tTotals = tCounts[t.length],
        scores = new Array(t.length + 1),
        tCursor, i, ch, a, b, cost;
    for (tCursor = 0; tCursor <= t.length; ++tCursor) {
      tCountsHere = tCounts[tCursor];
      cost = 0;
      for (i = 0; i < chars.length; ++i) {
        ch = chars[i];
        a = sCountsHere[ch] / sTotals[ch];
        b = tCountsHere[ch] / tTotals[ch];
        cost += Math.pow(Math.abs(a - b), 2);
      }
      scores[tCursor] = cost;
    }
    return scores;
  };

  retrospective.makeMaintainer = function (costFunction) {
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

  retrospective.augmentFormat = function (format, costFunction) {
    var maintainer;
    if (costFunction === undefined) {
      costFunction = cost.frequencyRatios;
    }
    maintainer = retrospective.makeMaintainer(costFunction);
    return function (raw, cursor) {
      var formatted = format(raw).text,
          result = maintainer(raw, cursor, formatted);
      result.text = formatted;
      return result;
    };
  };


  return {
    retrospective: retrospective,
    layer: layer,
    TextWithCursor: TextWithCursor
  };
})();
