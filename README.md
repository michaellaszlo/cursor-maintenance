# Maintaining cursor position in same-field formatting

Cursor maintenance is a problem that occurs when you build an input
field that allows the user to edit text with the help of a cursor, and
also formats the text after user editing.

After the text has been formatted, where do you put the cursor? That
is the problem of cursor maintenance. This package implements several
solutions that vary in accuracy and ease of use.


# Format-independent cursor maintenance

Load `cursor_maintainer.js` and make a cursor maintainer:

```
var maintainer = CursorMaintainer.retrospective.makeMaintainer();
```

You pass three input values to the maintainer:

- the user's *raw text*
- the user's *cursor position* in the raw text
- the *formatted text* obtained from your raw text

You get back one value:

- a *new cursor position*

For example:

```
var newPosition = maintainer('  2400.015 ', 2, '2,400.02');
```

