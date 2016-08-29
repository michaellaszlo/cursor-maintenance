# Maintaining cursor position in same-field formatting

This package supports several approaches to cursor maintenance, which
arises in the following scenario:

- the user controls a cursor in an input field
- the user edits the text
- the text gets formatted by an automatic process
- the input field is overwritten with the formatted text

Where do you put the cursor in the formatted text? That is the problem
of cursor maintenance.


## Format-independent cursor maintenance

You can do cursor maintenance by passing three values to a function:

- the *raw text*
- the *raw cursor position*
- the *formatted text*

You get back one value:

- a *new cursor position*



