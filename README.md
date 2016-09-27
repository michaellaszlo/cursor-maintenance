# Maintaining cursor position in formatted input fields

Cursor maintenance is a problem that arises when you build a formatted
input field that lets the user freely move a cursor and edit the
text. After some user editing, the text is formatted by the input
field. Now where should the cursor go?

I have written an article that discusses the problem of cursor maintenance
in detail. This repository contains code for several approaches that
vary in accuracy and ease of implementation.


## Basic demo

The layer approach to cursor maintenance offers a reasonable balance of
accuracy and ease of implementation. I have made a basic demonstration
of the layer approach in a page that looks like this:

![Basic implementation of cursor
maintenance](https://github.com/michaellaszlo/maintaining-cursor-position/blob/master/screenshots/basic_demo.png)

You may wish to try out the basic demo on my website or see its source
code in this repository.


## Configurable demos

I have also made a more elaborate page with user-configurable
demonstrations of several cursor-maintenance approaches. It looks
like this:

![Interactive implementation of several cursor-maintenance
approaches](https://github.com/michaellaszlo/maintaining-cursor-position/blob/master/screenshots/configurable_demos.png)

The configurable demo page is hosted live on my website and its source
code is available in this repository.


## Choosing an approach

- circumvent?
- ad hoc?
- retrospective
- layer
- meta


## General usage model


## Using the retrospective approach

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


## Using the layer approach


## Using the meta approach


