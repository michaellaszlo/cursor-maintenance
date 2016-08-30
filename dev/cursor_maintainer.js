var CursorMaintainer = (function () {
  'use strict';

  var layer,          // A statistical approach configured per format.
      retrospective,  // Format-independent statistical cursor maintenance.
      costFunctions;  // Cost functions for the retrospective approach.


  //--- Meta approach: reimplement the format with elementary operations
  // on an object that stores text with a cursor.

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


  //--- Layer approach: a statistical approach configured per format.

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


  //--- Retrospective approach: format-independent statistical cursor
  // maintenance.

  costFunctions = {};
  retrospective = { costFunctions: costFunctions };

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

  costFunctions.splitLevenshtein = function (s, sCursor, t, tCursor) {
    var left = levenshtein(s.substring(0, sCursor), t.substring(0, tCursor)),
        right = levenshtein(s.substring(sCursor), t.substring(tCursor));
    return left + right;
  };

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

  costFunctions.frequencyRatios = function (s, sCursor, t, tCursor) {
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
  };

  retrospective.augmentFormat = function (format, costFunction) {
    if (costFunction === undefined) {
      costFunction = cost.frequencyRatios;
    }
    return function (raw, cursor) {
      var formatted = format(raw).text,
          cost, pos,
          bestCost = costFunction(raw, cursor, formatted, 0),
          bestPos = 0,
          scores = [ bestCost ];
      for (pos = 1; pos <= formatted.length; ++pos) {
        cost = costFunction(raw, cursor, formatted, pos);
        if (cost < bestCost) {
          bestCost = cost;
          bestPos = pos;
        }
        scores.push(cost);
      }
      return { text: formatted, cursor: bestPos, scores: scores };
    };
  };


  return {
    retrospective: retrospective,
    layer: layer,
    TextWithCursor: TextWithCursor
  };
})();
