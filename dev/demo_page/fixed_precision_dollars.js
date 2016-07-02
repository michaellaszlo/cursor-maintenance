function (s) {
  var decimalPos, whole, fraction, start, groups, i;
  s = s.replace(/[^0-9.]/g, '');
  s = s.replace(/^0+/, '');
  decimalPos = s.indexOf('.');
  if (decimalPos == -1) {
    whole = s;
    fraction = '';
  } else {
    whole = s.substring(0, decimalPos);
    fraction = s.substring(decimalPos).replace(/[.]/g, '');
  }
  whole = whole || '0';
  fraction = (fraction + '00').substring(0, 2);
  start = whole.length % 3 || 3;
  groups = [ whole.substring(0, start) ];
  for (i = start; i < whole.length; i += 3) {
    groups.push(whole.substring(i, i + 3));
  }
  return '$' + groups.join(',') + '.' + fraction;
}
