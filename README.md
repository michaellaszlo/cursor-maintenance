# Maintaining cursor position in a formatted input field

A thorny problem comes up when you're building a formatted input field
that lets the user freely move a cursor and edit the text. After some
user editing, the text is reformatted by the input field. Now where
should the cursor go? That is the problem of cursor maintenance.

I have written a detailed article about cursor maintenance. It's
a complicated problem with fuzzy criteria and many possible
approaches. There is no silver bullet. Each approach offers a compromise
between reliability and ease of implementation. Sometimes, depending
on the text format and how you want the user to interact with the input
field, there is no good solution. Then again, sometimes it is possible
to achieve accurate cursor maintenance with the right approach.

This repository provides framework code and implementation examples for
three approaches. I characterize them as follows:

Name of approach  |  Ease of implementation  |  Accuracy
---|---|---
Retrospective  |  Easy  |  Susceptible to faulty cursor positioning
Layer  |  Medium  |  Can be made completely accurate for some formats
Meta  |  Hard  |  Can be made completely accurate for many formats


## Basic demo

The layer approach to cursor maintenance offers a reasonable balance of
accuracy and ease of implementation. I have made a basic demonstration
of the layer approach that looks like this:

[![Basic implementation of cursor
maintenance](https://github.com/michaellaszlo/maintaining-cursor-position/blob/master/screenshots/basic_demo.png)](http://michaellaszlo.com/maintaining-cursor-position/basic-demo/)

You may wish to try out the [basic demo](http://michaellaszlo.com/maintaining-cursor-position/basic-demo/)
on my website or see its [source code](https://github.com/michaellaszlo/maintaining-cursor-position/tree/master/basic_demo) in this repository.


## Extended demos

I have also made a more elaborate page demonstrating the meta,
retrospective, and layer approaches. The retrospective and layer demos
can be configured with a formatting function of your choice. The layer
demo allows you to specify the layers.


[![Interactive implementation of several cursor-maintenance
approaches](https://github.com/michaellaszlo/maintaining-cursor-position/blob/master/screenshots/extended_demo.png)](http://michaellaszlo.com/maintaining-cursor-position/extended-demo/)

The [extended demo](http://michaellaszlo.com/maintaining-cursor-position/extended-demo/) page is hosted live on my website and the
[source code](https://github.com/michaellaszlo/maintaining-cursor-position/tree/master/extended_demo) is available in this repository.


## General implementation model



## Implementing the retrospective approach

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


## Implementing the layer approach


## Implementing the meta approach


