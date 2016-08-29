# Maintaining cursor position in same-field formatting

This package implements several approaches to the problem of cursor
maintenance, which arises in the following scenario:

- the user has a movable cursor in an input field
- the user edits the text and leaves the cursor in the text
- the text is formatted by an automatic process
- the input field is overwritten with the formatted text
- where do you put the cursor?


## How to use the CursorMaintainer module

A cursor maintainer is a function that takes four arguments:

- the user's *raw text*
- the user's *raw cursor position*
- the position of 

After loading `cursor_maintainer.js`,

