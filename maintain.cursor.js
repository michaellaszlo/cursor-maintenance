var MaintainCursor = (function () {

  // restoreCursor repositions a cursor in a string after the string has
  //   been transformed by some formatting process which is unknown to us.
  //   Our approach is to incorporate the cursor into the string as a
  //   special character and to look for a new cursor position that
  //   minimizes the edit distance between the old and new strings.
  // original: the string before formatting. Must not contain a
  //   representation of the cursor. We insert our own cursor character
  //   for the purpose of the computation.
  // position: the cursor position in the original string, specified with the
  //   zero-based index of the character immediately to the right of the
  //   cursor, or by the string length if the cursor is at the end.
  // formatted: the outcome of formatting the original string.
  // return value: a cursor position in the formatted string.
  //
  function restoreCursor(original, cursorPosition, formatted) {
    var cursorCharCode,
        cursorChar,
        substitute,
        low, high,
        found,
        bestCost,
        bestPositions,
        cost,
        position,
        sum,
        i, s, t,
        n = original.length,
        m = formatted.length,
        editDistanceFunction = sillyEditDistance;

    // If the cursor character is present in the string, replace it with
    // a printable ASCII character (codes 32 through 126). If all of these
    // are present in the string, give up and return null.
    cursorCharCode = 126;  // 126 = '~' (tilde character)
    cursorChar = String.fromCharCode(cursorCharCode);
    low = 32;
    high = 126;
    if (original.indexOf(cursorChar) !== -1) {
      found = new Array(high - low + 1);
      for (i = 0; i < n; ++i) {
        found[original.charCodeAt(i) - low] = true;
      }
      for (i = low; i <= high; ++i) {
        if (found[i - low] === undefined) {
          substitute = String.fromCharCode(i);
          original = original.replace(cursorChar, substitute);
          break;
        }
      }
      if (i > high) {
        return null;
      }
    }

    // Incorporate the cursor character into the original string.
    s = original.substring(0, cursorPosition) + cursorChar +
        original.substring(cursorPosition);

    // Consider every possible cursor position in the formatted string.
    bestCost = Math.max(n, m) + 1;
    for (position = 0; position <= m; ++position) {
      t = formatted.substring(0, position) + cursorChar +
          formatted.substring(position);
      cost = editDistanceFunction(s, t);
      if (cost < bestCost) {
        bestCost = cost;
        bestPositions = [ position ];
      } else if (cost == bestCost) {
        bestPositions.push(position);
      }
    }

    // Take the mean of the lowest-cost cursor positions, rounded to
    // the nearest integer.
    sum = 0;
    for (i = 0; i < bestPositions.length; ++i) {
      sum += bestPositions[i];
    }
    return Math.round(sum / bestPositions.length);
  }

  function sillyEditDistance(s, t) {
    if (t.indexOf('~') == t.length - 1) {
      return 0;
    }
    return 1;
  }

  function computeLevenshteinDistance(s, t) {
    var distance = 0,
        n = original.length,
        m = formatted.length,
        i, j;
  }

  var message = (this.console ? this.console.log : this.print);

  function test() {
    [ [ '1234', 2, '1,234' ]
    ].forEach(function (tuple) {
      var original = tuple[0],
          cursorPosition = tuple[1],
          formatted = tuple[2],
          newPosition = restoreCursor(original, cursorPosition, formatted),
          cursorChar = '~',
          s = original.substring(0, cursorPosition) + cursorChar + 
              original.substring(cursorPosition),
          t = formatted.substring(0, newPosition) + cursorChar + 
              formatted.substring(newPosition);
      message('"' + s + '" -> "' + t + '"');
    });
  }

  return {
    restoreCursor: restoreCursor,
    test: test
  };
})();

MaintainCursor.test();
