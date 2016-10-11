# Cursor maintenance


## Maintaining cursor position in a formatted input field

A vexing question comes up when you're building a formatted input field
that lets the user freely move a cursor. After some user editing, the
text is reformatted by the input field. Where should the cursor appear
after reformatting?

For example, suppose the input field contains formatted text representing
a number:

    45,900

The user inserts a cursor to the right of the `9` and hits backspace:

    45,^00

The text is reformatted:

    4,500

The user expects to see the cursor to the right of the `5`, where the
`9` used to be:

    4,5^00

How can we calculate the new cursor position automatically? That is the
problem of cursor maintenance.

I have posted a [detailed introduction]() to cursor maintenance on
my website. It's a complicated problem with fuzzy criteria. You can
approach it in several ways depending on the text format and how you
want the user to interact with the input field. Sometimes there is no
reliable way to maintain the cursor. If so, it is best to dodge the
problem by removing the cursor upon reformatting or by displaying the
formatted text separately from the input text. Then again, sometimes
it is possible to achieve reliable cursor maintenance, resulting in a
seamless input interface.

This repository provides framework code and implementation examples for
three approaches to cursor maintenance. I characterize them as follows:

Name of approach  |  Ease of implementation  |  Reliability
---|---|---
Retrospective  |  Easy  |  Susceptible to faulty cursor positioning
Layer  |  Medium  |  Can be made accurate for some formats
Meta  |  Hard  |  Can be made accurate for many formats


## Basic demo

The layer approach to cursor maintenance offers a reasonable balance of
reliability and ease of implementation. I have made a basic demonstration
of the layer approach that looks like this:

[![Basic implementation of cursor
maintenance](https://github.com/michaellaszlo/cursor-maintenance/blob/master/screenshots/basic_demo.png)](http://michaellaszlo.com/cursor-maintenance/basic-demo/)

You may wish to try out the [basic demo](http://michaellaszlo.com/cursor-maintenance/basic-demo/)
on my website or see its [source code](https://github.com/michaellaszlo/cursor-maintenance/tree/master/basic_demo) in this repository.


## Extended demos

I have made a more elaborate page demonstrating the meta, retrospective,
and layer approaches. The retrospective and layer demos allow you to
specify any formatting function. The layer demo also allows you to define
the layers.

[![Interactive implementation of several cursor-maintenance
approaches](https://github.com/michaellaszlo/cursor-maintenance/blob/master/screenshots/extended_demo.png)](http://michaellaszlo.com/cursor-maintenance/extended-demo/)

The [extended demo](http://michaellaszlo.com/cursor-maintenance/extended-demo/) page is hosted live on my website and the
[source code](https://github.com/michaellaszlo/cursor-maintenance/tree/master/extended_demo) is available in this repository.


## General implementation model

Cursor maintenance is the third step in this sequence:

1. The user edits the text in the input field with the help of a cursor.
1. The user's raw text is replaced with formatted text.
1. The cursor is repositioned in the input field.

You, the developer, define the formatter, which is a function that takes
raw text and returns formatted text. You decide when the text should be
formatted: perhaps after every keystroke, perhaps after a special user
action, perhaps at regular intervals.

If the formatted text is identical to the raw text, there is nothing
further to do. The cursor should stay where it is.

Otherwise, you want to compute a new cursor position. You can do so
with a cursor maintainer or with a cursor-maintaining formatter.


### Cursor maintainer

A cursor maintainer doesn't know about your format in general. You call
it with three values:

- the user's **raw text**
- the user's **cursor position** in the raw text
- the **formatted text** that you computed from the raw text

You get back one value:

- a **new cursor position** in the formatted text


### Cursor-maintaining formatter

A cursor-maintaining formatter is built for a specific format. You call
it with two values:

- the user's **raw text**
- the user's **cursor position** in the raw text

You get back two values:

- the **formatted text** computed from the raw text
- a **new cursor position** in the formatted text


## Using the retrospective approach

After loading `cursor_maintenance.js`, instantiate a retrospective cursor
maintainer:

```
maintainer = CursorMaintenance.retrospective.makeMaintainer();
```

Compute a new cursor position:

```
newPosition = maintainer('  2400.015 ', 3, '2,400.02').cursor;
```

The cursor maintainer is stateless. You can instantiate one and use
it repeatedly.

To make a cursor-maintaining formatter based on your plain formatter:

```
cmFormatter = CursorMaintenance.retrospective.augmentFormat(formatter);
```

To use the cursor-maintaining formatter:
```
result = cmFormatter('  2400.015 ', 2);
formattedText = result.text;
newCursor = result.cursor;
```

You can react to editing actions in your input element with a function
that looks something like this:

```
function update(input) {
  var rawText = input.value,
      rawCursor = getCursor(input),
      formatted = cmFormatter(rawText, rawCursor);
  if (formatted.text !== rawText) {
    input.value = formatted.text;
    setCursor(input, formatted.cursor);
  }
}
```

To get the cursor position and set the cursor, you can use
`selectionStart` and `setSelectionRange` as demonstrated in the [basic
demo](https://github.com/michaellaszlo/cursor-maintenance/blob/master/basic_demo/basic_demo.js#L48-L52).


## Using the layer approach

The layer approach requires that you specify a sequence of character
sets that will be used to extract layers from the raw text and formatted
text. The details of this approach are described [in an article]().

To define a character set, write a regular expression that tests a single
character. For example, you can write `/[0-9a-f]/i` to extract a layer
consisting of hexadecimal digits.

Instantiate a cursor maintainer by passing an array of regular
expressions:

```
maintainer = CursorMaintenance.layer.makeMaintainer([ /\d/, /\s/ ]);
```

The resulting function has the same interface as a retrospective cursor
maintainer. See the previous section for usage examples.

By default, a layer-based cursor maintainer breaks ties to the left,
meaning that it chooses the leftmost position in the final candidate
range. You can make a layer-based cursor maintainer that breaks ties to
the right by passing an additional argument:

```
maintainer = CursorMaintenance.layer.makeMaintainer([ /\d/, /\s/ ], true);
```

To make a cursor-maintaining formatter with the layer approach:

```
cmfLeft = CursorMaintenance.layer.augmentFormat(formatter, [ /\w/ ]);
cmfRight = CursorMaintenance.layer.augmentFormat(formatter, [ /\w/ ], true);
```

The resulting function is interchangeable with a retrospective
cursor-maintaining formatter. See the previous section for usage examples.


## Using the meta approach

In the meta approach, you reimplement your format with a sequence
of elementary operations on an object that represents text with a
cursor. Each operation moves the cursor in a straightforward manner.

To initialize such an object, call the `CursorMaintenance.TextWithCursor`
constructor. For example, this is how we construct an object that
represents the text `'hello'` with the cursor at position 4:

```
s = new CursorMaintenance.TextWithCursor('hello', 4);
```

`TextWithCursor` has two methods that alter the text:

- `insert(begin, subtext)`: Inserts the string `subtext` at position
`begin`; moves the cursor rightward by the number of characters that
are inserted to its left.

- `delete(begin, length)`: Deletes `length` characters (one character if
`length` is omitted) starting from `begin`; moves the cursor leftward
by the number of characters that are deleted to its left.

To read the cursor position, access the `TextWithCursor` object's
`cursor` property.

`TextWithCursor` has two methods that return information:

- `read(begin, length)`: Returns a string consisting of the `length`
characters (one character if `length` is omitted) starting at `begin`.

- `length()`: Returns the length of the text.

Although each call to `insert` and `delete` has a small and reasonable
effect on the cursor, the overall effect after making a sequence of calls
may be neither small nor reasonable. For example, you could implement a
format by deleting the entire text and rebuilding it from left to right,
which has the effect of moving the cursor to the leftmost position every
time. That would defeat the purpose of the meta approach.

The text-with-cursor object doesn't do any magic, unfortunately. It's
a very light text-manipulation framework that does the menial task of
updating the cursor position&mdash;it handles the bookkeeping, as it
were&mdash;and leaves the creative thinking to you. You must decide on a
series of operations that implements your format while moving the cursor
in a way that the user can readily predict.

The key to achieving predictable cursor movement is to localize
destructive operations around the cursor. If you delete a span of
text that includes or borders on the cursor, make the span as small
as possible.

Consider how we might use the meta approach to
reimplement the credit-card formatter used in the [basic
demo](http://michaellaszlo.com/cursor-maintenance/basic-demo/).
Here is the plain formatter:

```
function creditCard(s) {
  var groups = [],
      i;
  s = s.replace(/\D/g, '');            // Remove all non-digit characters.
  s = s.substring(0, 16);              // Keep no more than 16 digits.
  for (i = 0; i < s.length; i += 4) {  // Make four-digit groups.
    groups.push(s.substring(i, i + 4));
  }
  return groups.join(' ');             // Put spaces between the groups.
}
```

And here is the same format implemented with `TextWithCursor` operations:

```
meta.creditCard = function (s, cursor) {
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
```

Additional examples can be found in
[`cursor_maintenance_examples`](https://github.com/michaellaszlo/cursor-maintenance/blob/master/cursor_maintenance_examples.js),
which contains two more [plain
formatters](https://github.com/michaellaszlo/cursor-maintenance/blob/master/cursor_maintenance_examples.js#L22-L59),
`commatize` and `trimify`, that are each reimplemented with the [meta
approach](https://github.com/michaellaszlo/cursor-maintenance/blob/master/cursor_maintenance_examples.js#L236-L305).


