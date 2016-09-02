load('../cursor_maintainer.js');
var maintain = CursorMaintainer.retrospective.makeMaintainer(),
    i, tuple, cursor,
    data = [ [ '2500', 1, '2,500', 1 ],
             [ '12500', 3, '12,500', 4 ],
             [ '5,4990000', 9, '54,990,000', 10 ],
             [ '  hello  ', 8, 'hello ', 6 ],
             [ '  hello  ', 1, 'hello ', 0 ],
             [ 'Hello,  friends.', 7, 'Hello, friends.', 7 ] ];
for (i = 0; i < data.length; ++i) {
  tuple = data[i];
  print('test case: ' + tuple.join(' '));
  cursor = maintain(tuple[0], tuple[1], tuple[2]).cursor;
  if (cursor == tuple[3]) {
    print('  correct');
  } else {
    print('  ' + cursor + ' != ' + tuple[3]);
  }
}
