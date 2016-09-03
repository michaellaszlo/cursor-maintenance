# Maintaining cursor position in same-field formatting

This package supports several approaches to cursor maintenance, which
arises in the following scenario:

- the user controls a cursor in an input field
- the user edits the text
- the text gets formatted by an automatic process
- the input field is overwritten with the formatted text

Where do you put the cursor in the formatted text? That is the problem
of cursor maintenance.


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

