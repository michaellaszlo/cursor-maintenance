var FormatNumber = (function () {

  // Operates on a string consisting of zero or more digits.
  function groupDigits(s, groupSize, separator) {
    var groupSize = groupSize || 3,
        separator = separator || ',',
        length,
        i,
        pos,
        parts;
    if (/^\d*$/.test(s) === false) {
      return null;
    }
    length = s.length;
    if (length == 0) {
      return s;
    }
    parts = new Array(Math.floor((length + groupSize - 1) / groupSize));
    pos = length;
    for (i = parts.length - 1; i >= 0; --i) {
      parts[i] = s.substring(pos - groupSize, pos);
      pos -= groupSize;
    }
    return parts.join(separator);
  }

  var message = (this.console ? this.console.log : this.print);

  function test() {
    [ // Test groupDigits.
      'abc', 'x02', '-12', '2.4',  // Invalid input.
      '', '0', '42', '123', '5005', '16384', '650444',
      '1000555', '45212800', '600333001', '8045000555'
    ].forEach(function (s) {
      var t = groupDigits(s);
      message('"' + s + '" -> "' + t + '"');
    });
  }

  return {
    groupDigits: groupDigits,
    test: test
  };
})();
