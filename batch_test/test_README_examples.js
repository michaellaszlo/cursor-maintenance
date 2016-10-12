// This file tests the code samples shown in the README.

load('../cursor_maintenance.js')
load('../cursor_maintenance_examples.js')

//maintainer = CursorMaintenance.retrospective.makeMaintainer();
//maintainer = CursorMaintenance.layer.makeMaintainer([ /\d/, /\s/ ]);
maintainer = CursorMaintenance.layer.makeMaintainer([ /\d/, /\s/ ], true);

newPosition = maintainer('  2400.015 ', 3, '2,400.02').cursor;
print(JSON.stringify(newPosition));

formatter = CursorMaintenanceExamples.plain.commatize
//cmFormatter = CursorMaintenance.retrospective.augmentFormat(formatter);
//cmFormatter = CursorMaintenance.layer.augmentFormat(formatter, [ /\w/ ]);
cmFormatter = CursorMaintenance.layer.augmentFormat(formatter, [ /\w/ ], true);
result = cmFormatter('2400', 2);
formattedText = result.text;
newCursor = result.cursor;
print(formattedText, newCursor);

s = new CursorMaintenance.TextWithCursor('hello', 4);
print(s.read(0, 4));
print(s.read(1, 4));
print(s.read(0, s.length()));
s.insert(5, ' world');
print(s.read(0, s.length()));
s.insert(5, ',');
print(s.read(0, s.length()));
s.insert(12, '.');
print(s.read(0, s.length()));
s.delete(0);
s.insert(0, 'H');
print(s.read(0, s.length()));

plainCreditCard = function (s) {
  var groups = [],
      i;
  s = s.replace(/\D/g, '');            // Remove all non-digit characters.
  s = s.substring(0, 16);              // Keep no more than 16 digits.
  for (i = 0; i < s.length; i += 4) {  // Make four-digit groups.
    groups.push(s.substring(i, i + 4));
  }
  return groups.join(' ');             // Put spaces between the groups.
};
CM = CursorMaintenance;
metaCreditCard = function (s, cursor) {
  var t = new CM.TextWithCursor(s, cursor),
      pos, start;
  for (pos = t.length() - 1; pos >= 0; --pos) {
    if (!/\d/.test(t.read(pos))) {  // Remove all non-digit characters.
      t.delete(pos);
    }
  }
  if (t.length() > 16) {            // Keep no more than 16 digits.
    t.delete(16, t.length() - 16);
  }
  start = Math.min(12, t.length() - t.length()%4);
  for (pos = start; pos > 0; pos -= 4) {
    t.insert(pos, ' ');             // Put spaces between four-digit groups.
  }
  return t;
};
print(plainCreditCard(' 345  2345234 '));
print(JSON.stringify(metaCreditCard(' 345  2345234 ')));
