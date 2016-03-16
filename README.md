# Maintaining cursor position

The problem of maintaining cursor position across formatting operations
is discussed in an article on my website. The code in this repository
demonstrates several approaches to solving the problem and provides a
practical implementation of one approach.


## The four approaches

We demonstrate four ways to approach the problem of cursor maintenance:

- Numerical: use ad hoc rules while formatting to move the cursor

- Textual: incorporate the cursor into the text as a special character

- Meta: apply formatting to objects that represent text with a cursor

- Retrospective: after formatting the text, calculate a new cursor position


### Executing the demonstrations

To run the Python demonstration, execute this on the command line:

```
$ python approach_examples.py
```

The code is compatible with Python 2 and Python 3.

To run the JavaScript demonstration:

```
$ d8 approach_examples.js
```

The Python and JavaScript files implement the same algorithms. They
should return identical results for any test case.


### The formatting operations

Two formatting operations, commatize and trimify, are applied to test
cases that each consist of a string and a cursor position. To display
the test cases for both operations, execute this in Python:

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


