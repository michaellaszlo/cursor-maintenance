# Maintaining cursor position in same-field formatting

The CursorMaintainer module implements several approaches to the problem
of cursor maintenance, which arises in the following scenario:

- the user has a movable cursor in an input field
- the user edits the text and leaves the cursor in the text
- the text is formatted by an automatic process
- the input field is overwritten with the formatted text
- where do you insert the cursor in the formatted text?

