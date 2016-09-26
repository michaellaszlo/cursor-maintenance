# Maintaining cursor position in same-field formatting

Cursor maintenance is a problem that arises when you build a
self-formatting input field. You let the user move a cursor around the
input field and edit the text. After some user editing, the text is
formatted by the input field. Now where should you put the cursor?

This project implements several approaches to cursor maintenance. I have
made a basic page demonstrating one of the simplest approaches. It looks
like this:

![Basic implementation of cursor
maintenance](screenshots/screenshot.basic.page.png)

I also have a more elaborate demonstration page:

![Interactive implementation of several cursor-maintenance
approaches](screenshots/screenshot.demo.page.png)


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

