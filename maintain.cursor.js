// an article about this code and the problem that it attempts to solve:
//   ?
// code repository:
//   ?

var MaintainCursor = (function () {

  // findNewPosition repositions a cursor in a string after the string has
  //   been transformed by some formatting process which is unknown to us.
  //   Our approach is to incorporate the cursor into the string as a
  //   special character and to look for a new cursor position that
  //   minimizes the edit distance between the old and new strings.
  // original: the string before formatting. Must not contain a
  //   representation of the cursor. We insert our own cursor character
  //   for the purpose of the computation.
  // position: the cursor position in the original string, specified by
  //   the zero-based index of the character immediately to the right of
  //   the cursor, or by the string length if the cursor is at the end.
  // formatted: the outcome of formatting the original string.
  // return value: a cursor position in the formatted string.
  function findNewPosition(original, cursorPosition, formatted) {
    var cursorChar,
        substitute,
        regex,
        low, high,
        found,
        bestCost,
        bestPosition,
        cost,
        position,
        sum,
        i, s, t,
        n = original.length,
        m = formatted.length,
        editDistance = levenshtein;

    // If the cursor character is present in the string, replace it with
    // a printable ASCII character (codes 32 through 126). If all of these
    // are present in the string, give up and return null.
    cursorChar = '^';
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
          regex = new RegExp('\\' + cursorChar, 'g');
          original = original.replace(regex, substitute);
          formatted = formatted.replace(regex, substitute);
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
    print('original ' + s);

    // Consider every possible cursor position in the formatted string.
    bestCost = Math.max(n, m) + 1;
    for (position = 0; position <= m; ++position) {
      t = formatted.substring(0, position) + cursorChar +
          formatted.substring(position);
      cost = editDistance(s, t);
      print('  cost ' + cost + ': ' + t);
      if (cost < bestCost) {
        bestCost = cost;
        bestPosition = position;
      }
    }

    return bestPosition;
  }

  // Compute the Levenshtein distance between strings s and t.
  function levenshtein(s, t) {
    var distance = 0,
        n = s.length,
        m = t.length,
        previous,
        current,
        temp,
        i, j;
    if (Math.min(n, m) == 0) {
      return Math.max(n, m);
    }
    current = new Array(m + 1);
    for (j = 0; j <= m; ++j) {
      current[j] = j;
    }
    previous = new Array(m + 1);
    for (i = 1; i <= n; ++i) {
      temp = previous;
      previous = current;
      current = temp;
      current[0] = previous[0] + 1;
      for (j = 1; j <= m; ++j) {
        if (t[j - 1] == s[i - 1]) {
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

  var message = (this.console ? this.console.log : this.print);

  function test() {
    [ // Test Levenshtein distance computation.
      [ 'sitting', 'kitten' ],
      [ 'Saturday', 'Sunday' ],
      [ 'flaw', 'lawn' ]
    ].forEach(function (tuple) {
      var s = tuple[0],
          t = tuple[1],
          d = levenshtein(s, t);
      message('Levenshtein: "' + s + '" -> "' + t + '" ' + d);
    });

    [ // Test cursor restoration.
      [ '1234', 2, '1,234' ],
      [ '1,23', 4, '123' ],
      [ '1,24', 3, '124' ],
      [ '1,34', 2, '134' ],
      [ ',234', 0, '234' ],
      [ '[,234]', 2, '[234]' ],
      [ '[,234]', 3, '[234]' ],
      [ '^,234^', 2, '^234^' ],
      [ '^^1,34^^', 4, '^^134^^' ],
      [ '123,4506', 7, '1,234,056' ],
      [ '1,234,56', 7, '123,456' ],
      [ '12,345,68', 8, '1,234,568' ],
      [ '$50.', 4, '$50.00' ],
      [ '$50.00', 6, '$50' ],
      [ '$51.00', 3, '$51' ],
      [ '$50.00', 3, '$50' ],
      [ '11,11', 4, '1,111' ],
      [ '1300', 2, '1,300' ],
      [ '1,4000', 3, '14,000' ],
      [ '10,4900', 4, '104,900' ],
      [ '13,00', 4, '1,300' ],
      [ '1,00000', 5, '100,000' ],
      [ '1,00000', 4, '100,000' ],
      [ '1,2500', 5, '12,500' ],
      [ '1,2500', 6, '12,500' ],
      [ '1,2509', 5, '12,509' ],
      [ '1,2509', 6, '12,509' ],
      [ '10,00', 4, '1,000' ]
    ].forEach(function (tuple) {
      var original = tuple[0],
          cursorPosition = tuple[1],
          formatted = tuple[2],
          newPosition = findNewPosition(original, cursorPosition, formatted),
          cursorChar = '_',
          s = original.substring(0, cursorPosition) + cursorChar + 
              original.substring(cursorPosition),
          t = formatted.substring(0, newPosition) + cursorChar + 
              formatted.substring(newPosition);
      message('restore cursor: "' + s + '" -> "' + t + '"');
    });
  }

  return {
    findNewPosition: findNewPosition,
    test: test
  };
})();
