# Maintaining cursor position

The problem of maintaining cursor position across formatting operations
is discussed in an article on my website. The code in this repository
demonstrates several approaches to solving the problem and provides a
practical implementation of one approach.


## Demonstrations

Among the files in this repository are a pair of equivalent scripts,
`approach_examples.py` and `approach_examples.js`, that demonstrate four
approaches to maintaining cursor position.

The Python script, `approach_examples.py`, is compatible with Python 2
and Python 3.

The JavaScript equivalent, `approach_examples.js`, can be executed
on the command line with [`nodejs`](https://nodejs.org/) or
[`d8`](https://developers.google.com/v8/build).

The Python and JavaScript files implement the same algorithms. They
should return identical results for any test case.

To run the Python demonstration, execute this on the command line:

```
$ python approach_examples.py
```

To run the JavaScript demonstration:

```
$ d8 approach_examples.js
```

The following sections explain what it is you're seeing when you run
the demonstrations.


### The four approaches

We demonstrate four broad ways to solve the problem of cursor maintenance.

- Numerical: use ad hoc rules while formatting to move the cursor

- Textual: incorporate the cursor into the text as a special character

- Meta: apply formatting to objects that represent text with a cursor

- Retrospective: after formatting the text, calculate a new cursor position

Each approach works toward the same goal, namely, keeping the cursor in
a position that minimizes user surprise while the text is transformed
by a formatting operation.


### The formatting operations

Each approach is demonstrated with two formatting operations.

The *commatize* operation takes a string representing a whole number
and inserts commas so that each group of three digits is separated by
a comma, proceeding from right to left. For example:

`"3141"` &rarr; `"3,141"`

Any incorrect commas are removed:

`",3141,592,65"` &rarr; `"314,159,265"`

The *trimify* operation strips space characters from the beginning and
end of a string, and condenses all other sequences of space characters
into one space each. For example:

`" Hello,   world.  Hi  there.  "` &rarr; `"Hello, world. Hi there."`

Only the visible space character, `' '` (code 32), is considered by
trimify, not other kinds of whitespace such as tab and newline characters.


### Test cases

The formatting operations are applied to test cases that each consist
of a string and a cursor position. To display the test cases for both
operations, execute this in Python:

```python
Test().display()
```

In JavaScript:

```javascript
(new Test()).display();
```

To display the test cases for one operation, say, commatize:

```python
Test().display('commatize')
```

```javascript
(new Test()).display('commatize');
```

To suppress the display of cursor positions:

```python
Test().display('commatize', False)
```

```javascript
(new Test()).display('commatize', false);
```

