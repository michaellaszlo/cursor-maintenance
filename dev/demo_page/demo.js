var CursorMaintenanceDemo = (function () {
  'use strict';

  // requires: cursor_maintainer.js
  //           cursor_maintainer_experiments.js
  //           web_utilities.js

  // CursorMaintenanceDemo powers a web page that provides user-configurable
  //  demonstrations of selected cursor-maintenance approaches. Formatting
  //  can be toggled off and on for each input area. The demonstration of
  //  the retrospective approach allows the user to specify her own cost
  //  function. The layer-approach demo also allows the user to define the
  //  character sets and the tie-breaker for the layer configuration.

  var CM = CursorMaintainer,
      CME = CursorMaintainerExperiments,
      make = DOMHelpers.make,
      classRemove = DOMHelpers.classRemove,
      layerConfigure;

  // getCursorPosition obtains the cursor position with selectionStart,
  //  which, according to the Mozilla Developer Network documentation,
  //  is supported by Chrome, Firefox, Safari, and IE 9+. According to
  //  whatwg.org, selectionStart is an attribute of input elements of type
  //  text, search, URL, tel, and password. In my experience, it also works
  //  for textarea elements.
  function getCursorPosition(input) {
    return input.selectionStart;
  }

  // setCursorPosition uses setSelectionRange, which, in my experience,
  //  works for input elements of type text as well as textarea elements
  //  in all recent browsers.
  function setCursorPosition(input, position) {
    input.setSelectionRange(position, position);
  }

  // setMaintainer attaches an event handler to the given input element so
  //  that the input text gets formatted and the cursor is maintained
  //  whenever the user changes the text. setMaintainer also builds a
  //  toggle element that lets the user disable formatting for this input.
  // input: An input element of type text or a textarea element.
  // format: A cursor-maintaining formatter or a function that returns a
  //  cursor-maintaining formatter. In the latter case, options.makeFormat
  //  must be true.
  // options: An optional argument which, if present, is an object containing
  //  optional values .validate and .makeFormat.
  function setMaintainer(input, format, options) {
    var formatted,
        toggleBox,
        validate,
        makeFormat,
        saved;
    if (typeof options == 'object') {
      // validate is an optional function that accepts or rejects input text.
      validate = options.validate;
      // makeFormat, if true, signifies that format() returns a formatter.
      makeFormat = options.makeFormat;
    }
    // saved will store the input state after each update, so that on the
    //  next call to the update function we can compare the current input
    //  state and return early if the state is unchanged.
    saved = { text: null, cursor: 0 };
    // update responds to events that have the potential to change the text
    //  in the input element. It performs input validation if specified,
    //  formats the text unless formatting has been toggled off, and
    //  changes the cursor position as needed.
    function update() {
      var text,
          cursor,
          formatted;
      text = input.value;
      cursor = getCursorPosition(input);
      // If the input text is invalid, restore the saved state and bail out.
      if (validate && validate(text) !== true) {
        input.value = saved.text;
        setCursorPosition(input, saved.cursor);
        return;
      }
      // If formatting has been disabled, do nothing further.
      if (!input.status.formatting) {
        return;
      }
      // If the user has not changed the text, accept the user cursor.
      if (text === saved.text) {
        saved.cursor = cursor;
        return;
      }
      // If the makeFormat option is true, the format argument passed to
      //  setMaintainer isn't a formatter but a function that returns a
      //  formatter. By evaluating this function, we obtain the formatter
      //  that the user currently specifies on the demo page.
      if (makeFormat) {
        formatted = format()(text, cursor);
      } else {
        formatted = format(text, cursor);
      }
      // If formatting leaves the user text unchanged, accept the user cursor.
      if (formatted.text === text) {
        saved.cursor = cursor;
        return;
      }
      // Update the input element and save its state.
      input.value = saved.text = formatted.text;
      setCursorPosition(input, saved.cursor = formatted.cursor);
    }
    // Listen for events that can change the input value.
    [ 'change', 'keydown', 'keyup', 'click' ].forEach(function (eventName) {
      input.addEventListener(eventName, update);
    });
    // Build an element that allows the user to toggle formatting on and off.
    // Add a logical toggle state to the input element.
    input.status = { formatting: false };
    // Build the physical toggle switch.
    toggleBox = make('div', { className: 'toggle' });
    toggleBox.addEventListener('click', function () {
      if (!input.status.formatting) {
        // Wipe out the saved text in case the user-defined format is changed
        //  while formatting is off. This ensures that even if the text is
        //  unchanged, the new format will be applied when formatting is
        //  turned back on.
        saved.text = null;
        input.status.formatting = true;
        this.className += ' active';
        toggleBox.innerHTML =
            '<span class="icon">&#x25a0;</span>formatting on';
        update();
      } else {
        input.status.formatting = false;
        classRemove(this, 'active');
        toggleBox.innerHTML =
            '<span class="icon">&#x25a1;</span>formatting off';
      }
      input.focus();
    });
    input.parentNode.insertBefore(toggleBox, input);
    toggleBox.click();
  }

  // makeFormatFromInput gets the content of a textarea and evaluates it
  //  as JavaScript to obtain a plain formatter, a function that implements
  //  a text transformation.
  // A discussion of security is in order because we are using eval. It is
  //  dangerous for a server to evaluate user-provided code or to share it
  //  among clients. In our case, however, the code is evaluated in the
  //  browser session in which the user entered the code. This incurs the
  //  same level of risk as the user typing arbitrary code into her
  //  browser's JavaScript console. In both cases, the code is entered
  //  voluntarily by the user and is executed in the user's own browser.
  function makeFormatFromInput(codeBox) {
    var code = '',
        formatter = null,
        result;
    return function (text) {
      var error,
          okay = true;
      // Check whether the code has changed since the last call.
      if (code !== codeBox.value) {
        code = codeBox.value;
        formatter = null;
        // Evaluate source code which is expected to define a function.
        try {
          formatter = eval('(' + code + ')');
        } catch (error) {
          okay = false;
          console.log('user-defined formatter: syntax error');
        }
        // Did the evaluation yield a function?
        if (typeof formatter !== 'function') {
          okay = false;
          formatter = null;
          console.log('user-defined formatter: not a function');
        }
        // If code evaluation failed, style the textarea to alert the user.
        if (okay) {
          classRemove(codeBox, 'error');
        } else {
          codeBox.className += ' error';
        }
      }
      if (formatter === null) {
        // The default text transformation returns the input text as is.
        result = text;
      } else {
        // If the evaluation of the user code yielded a function, we assume
        //  that it will perform a text transformation.
        result = formatter(text);
        // Check whether the user-defined function returned a string.
        if (typeof result !== 'string') {
          console.log('user-defined formatter: did not return a string' +
              result);
          result = text;
        }
      }
      return result;
    };
  }

  // layerConfigure groups together functions and DOM elements that make it
  //  possible for the user to configure the layer-approach demo.
  layerConfigure = {};

  // layerConfigure.getTesters makes a character-set tester from the content
  //  of each input field in the layer-configuration area. A tester is an
  //  object that includes a test function that returns true or false for
  //  a given character. In particular, a regex is a tester.
  // See the introductory comments to makeFormatFromInput for a discussion
  //  of security considerations. The same conclusion applies here because
  //  this function evaluates user-supplied code in the same way.
  layerConfigure.getTesters = function () {
    var inputs = layerConfigure.testerBox.getElementsByTagName('textarea'),
        testers = [],
        i, tester, error;
    for (i = 0; i < inputs.length; ++i) {
      // Evaluate source code which is expected to define a tester.
      try {
        tester = eval('(' + inputs[i].value + ')');
      } catch (error) {
        console.log('user-defined tester: syntax error');
        continue;
      }
      // Did the evaluation yield an object?
      if (typeof tester !== 'object') {
        console.log('user-defined tester: not an object');
        continue;
      }
      // Does the object include a test function?
      if (typeof tester.test !== 'function') {
        console.log('user-defined tester: no .test method');
        continue;
      }
      testers.push(tester);
    }
    return testers;
  }

  // layerConfigure.addTesterInput builds a new input element in which
  //  the user can define a character-set tester for the layer configuration.
  layerConfigure.addTesterInput = function (value) {
    var deleteButton = document.getElementById('deleteButton'),
        tester = make('textarea', { className: 'tester', spellcheck: false });
    if (value) {
      tester.value = value;
    }
    layerConfigure.testerBox.insertBefore(tester, deleteButton);
  };

  // layerConfigure.addTesterButtons builds a pair of buttons that allow the
  //  user to delete and add tester inputs. This function is called once,
  //  prior to the setMaintainer call for the layer demo.
  layerConfigure.addTesterButtons = function () {
    var deleteButton, newButton, container;
    container = layerConfigure.testerBox = document.getElementById('testerBox');
    deleteButton = make('div', { id: 'deleteButton', className: 'button',
        innerHTML: '&uarr; delete', parent: container });
    deleteButton.addEventListener('click', function () {
      // Is there a tester input for us to delete?
      var tester = deleteButton.previousSibling;
      if (tester === null) {
        return;
      }
      container.removeChild(tester);
      // If no tester inputs remain, gray out this button.
      if (deleteButton.previousSibling === null) {
        deleteButton.className += ' disabled';
      }
    });
    newButton = make('div', { id: 'newButton', className: 'button',
        innerHTML: 'new &darr;', parent: container });
    newButton.addEventListener('click', function () {
      layerConfigure.addTesterInput();
      classRemove(deleteButton, 'disabled');
    });
  };

  // layerConfigure.getTieBreakDirection gets the tie-breaking preference
  //  from the radio buttons at the bottom of the configuration area.
  layerConfigure.getTieBreakDirection = function () {
    var container = document.getElementById('tieBreakerBox'),
        buttons = container.getElementsByTagName('input');
    return buttons[0].checked ? 'left' : 'right';
  };

  // layerConfigure.setTieBreakDirection takes a tie-breaking preference and
  //  manipulates the radio buttons at the bottom of the configuration area.
  layerConfigure.setTieBreakDirection = function (direction) {
    var container = document.getElementById('tieBreakerBox'),
        buttons = container.getElementsByTagName('input');
    buttons[direction == 'left' ? 0 : 1].checked = true;
  };

  // load sets up the cursor-maintaining formatter for each demo by
  //  calling setMaintainer, then fills the input area with sample content.
  function load() {
    var divs, i, notes, columns, content, snippet;

    // Meta version of commatize, with an input validator that only accepts
    //  text consisting of digits and commas.
    setMaintainer(document.getElementById('commatizeInput'),
        CME.meta.commatize, {
          validate: function (text) {
                      return /^[0-9,]*$/.test(text);
                    }
        });
    document.getElementById('commatizeInput').value = '3171814';
    document.getElementById('commatizeInput').click();

    // Meta version of trimify.
    setMaintainer(document.getElementById('trimifyInput'),
        CME.meta.trimify);
    document.getElementById('trimifyInput').value =
        "\"Other maps are such shapes, with their islands and capes! / " +
        "   But we've got our brave Captain to thank\" / " +
        "(So the crew would protest) \"that he's bought us the best— / " +
        "   A perfect and absolute blank!\"";
    document.getElementById('trimifyInput').click();

    // Retrospective approach with frequency ratios applied to a
    //  user-defined formatting function.
    setMaintainer(document.getElementById('retrospectiveInput'),
        CM.retrospective.augmentFormat(
            makeFormatFromInput(document.getElementById('retrospectiveCode')),
            CM.retrospective.costFunctions.frequencyRatios));
    document.getElementById('retrospectiveInput').value = '29031.925';
    document.getElementById('retrospectiveCode').value = "function (s) {\n" +
        "  // Comma-separated dollar amount with unlimited cent precision.\n" +
        "  var decimalPos, whole, fraction, start, groups, i;\n" +
        "  s = s.replace(/[^0-9.]/g, '');\n" +
        "  s = s.replace(/^0+/, '0');\n" +
        "  if (s.length >= 2 && s.charAt(0) == '0' && s.charAt(1) != '.') {\n" +
        "    s = s.substring(1);\n" +
        "  }\n" +
        "  decimalPos = s.indexOf('.');\n" +
        "  s = s.replace(/[.]/g, '');\n" +
        "  whole = (decimalPos == -1 ? s : s.substring(0, decimalPos));\n" +
        "  start = whole.length % 3 || 3;\n" +
        "  groups = [ whole.substring(0, start) ];\n" +
        "  for (i = start; i < whole.length; i += 3) {\n" +
        "    groups.push(whole.substring(i, i + 3));\n" +
        "  }\n" +
        "  whole = groups.join(',');\n" +
        "  s = whole + (decimalPos == -1 ?\n" +
        "      '' : '.' + s.substring(decimalPos));\n" +
        "  return '$' + s;\n" +
        "}";
    document.getElementById('retrospectiveInput').click();

    // Layer approach applied to a user-defined formatting function.
    layerConfigure.addTesterButtons();
    setMaintainer(document.getElementById('layerInput'),
        function () {
            return CM.layer.augmentFormat(
                makeFormatFromInput(document.getElementById('layerCode')),
                layerConfigure.getTesters(),
                layerConfigure.getTieBreakDirection() == 'right');
        }, { makeFormat: true });
    document.getElementById('layerInput').value = "716";
    document.getElementById('layerCode').value = "function (s) {\n" +
        "  // Ten-digit phone number with hyphens.\n" +
        "  var t;\n" +
        "  s = s.replace(/\\D+/g, '').substring(0, 10);\n" +
        "  t = s.substring(0, 3);\n" +
        "  if (s.length > 3) {\n" +
        "    t += '-' + s.substring(3, 6);\n" +
        "  }\n" +
        "  if (s.length > 6) {\n" +
        "    t += '-' + s.substring(6);\n" +
        "  }\n" +
        "  return t;\n" +
        "}";
    layerConfigure.setTieBreakDirection('left');
    layerConfigure.addTesterInput('/\\d/');
    document.getElementById('layerInput').click();
    // Remove focus from the last input area that we clicked.
    document.getElementById('layerInput').blur();

    // The page position may have been changed by focus events as the input
    //  fields were initialized. Let's reset to the upper left corner.
    scrollTo(0, 0);

    // Add expander widgets to note sections. Notes are collapsed by default.
    NoteExpander.enableByTagAndClass(document, 'div', 'notes');
  }

  return {
    load: load
  };
})();

onload = CursorMaintenanceDemo.load;
