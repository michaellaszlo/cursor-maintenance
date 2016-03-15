# Maintaining cursor position

The problem of maintaining cursor position across formatting operations
is discussed in an article on my website. The code in this repository
demonstrates several approaches to solving the problem and provides a
practical implementation of one approach.


## Command-line demonstrations

To run the Python demonstration:

$ python approach_examples.py

The code is compatible with Python 2 and Python 3.

To run the JavaScript demonstration:

$ d8 approach_examples.js

The Python and JavaScript files implement the same algorithms. They
should return exactly the same result for any given input.


## Formatting operations

Two formatting operations, commatize and trimify, are applied to test
cases that each consist of a string and a cursor position. To display
the test cases for both operations, execute:

Test.display()

To display the test cases for only one operation, say, commatize:

Test.display('commatize')

To suppress



