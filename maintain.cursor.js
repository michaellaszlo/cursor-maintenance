var MaintainCursor = (function () {

  // restoreCursor repositions a cursor in a string after the string has
  //   undergone some formatting process. We don't know what kind of
  //   formatting has been applied. Our approach is to incorporate the
  //   cursor into the string as a special character and to look for a
  //   new cursor position that minimizes the Levenshtein distance
  //   between the old and new strings.
  // raw: the string before formatting
  // position: the cursor position in the raw string, specified with the
  //   zero-based index of the character immediately to the right of the
  //   cursor, or by the string length if the cursor is at the end
  // formatted: the outcome of formatting the raw string
  // return value: a cursor position in the formatted string
  //
  function restoreCursor(position, raw, formatted) {
  }

  var message = (this.console ? this.console.log : this.print);

  function test() {
  }

  return {
    restoreCursor: restoreCursor,
    test: test
  };
})();

MaintainCursor.test();
