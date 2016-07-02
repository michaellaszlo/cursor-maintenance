function (s) {
  var decimalPos, whole, fraction, start, groups, i;
  s = s.replace(/[^0-9.]/g, '');
  s = s.replace(/^0+/, '0');
  if (s.length >= 2 && s.charAt(0) == '0' && s.charAt(1) != '.') {
    s = s.substring(1);
  }
  decimalPos = s.indexOf('.');
  s = s.replace(/[.]/g, '');
  whole = (decimalPos == -1 ? s : s.substring(0, decimalPos));
  start = whole.length % 3 || 3;
  groups = [ whole.substring(0, start) ];
  for (i = start; i < whole.length; i += 3) {
    groups.push(whole.substring(i, i + 3));
  }
  whole = groups.join(',');
  s = whole + (decimalPos == -1 ?
      '' : '.' + s.substring(decimalPos));
  return '$' + s;
}
