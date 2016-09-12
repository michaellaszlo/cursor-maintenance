var CursorMaintenanceDemo = (function () {
  'use strict';

  // requires: cursor_maintainer.js
  //           cursor_maintainer_experiments.js
  //           note_expander.js

  // CursorMaintenanceDemo powers a web page that provides user-configurable
  //  demonstrations of selected cursor-maintenance approaches. Formatting
  //  can be toggled off and on for each input area. The demonstration of
  //  the retrospective approach allows the user to specify her own cost
  //  function. The layer-approach demo also allows the user to define the
  //  character sets and the tie-breaker for the layer configuration.

  var CM = CursorMaintainer,
      CME = CursorMaintainerExperiments,
      layerConfiguration;

  function getCursorPosition(input) {
    return input.selectionStart;
  }

  function setCursorPosition(input, position) {
    input.setSelectionRange(position, position);
  }

  // setMaintainer attaches an event handler to the given input element so
  //  that the input text gets formatted and the cursor is maintained
  //  whenever the user changes the text. setMaintainer also builds a
  //  toggle element that lets the user disable formatting for this input.
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
    toggleBox = document.createElement('div');
    toggleBox.className = 'toggle';
    toggleBox.onclick = function () {
      if (!input.status.formatting) {
        input.status.formatting = true;
        this.className += ' active';
        toggleBox.innerHTML =
            '<span class="icon">&#x25a0;</span>formatting on';
        update();
      } else {
        input.status.formatting = false;
        this.className = this.className.replace(/\s*active\s*/, ' ');
        toggleBox.innerHTML =
            '<span class="icon">&#x25a1;</span>formatting off';
      }
      input.focus();
    };
    toggleBox.click();
    input.parentNode.insertBefore(toggleBox, input);
  }

  // makeFormatFromInput gets text from an input area and evaluates it
  //  as JavaScript. A discussion of security is in order. We know that it
  //  is dangerous for a server to evaluate user-provided code or to share
  //  it among clients. In our case, however, the code is evaluated in the
  //  browser session in which the user entered the code. This incurs the
  //  same level of risk as the user typing arbitrary code into her own
  //  browser's JavaScript console. In both cases, the code is entered
  //  voluntarily by the user and is only executed in the user's browser.
  function makeFormatFromInput(codeBox) {
    var code = '',
        formatter = null,
        result;
    return function (text) {
      var error,
          okay = true;
      // Check for cached code.
      if (code !== codeBox.value) {
        code = codeBox.value;
        formatter = null;
        try {
          formatter = eval('(' + code + ')');
        } catch (error) {
          okay = false;
          console.log('user-defined formatter: syntax error');
        }
        if (typeof formatter !== 'function') {
          okay = false;
          formatter = null;
          console.log('user-defined formatter: not a function');
        }
        if (okay) {
          codeBox.className = codeBox.className.replace(/\s+error\s*/, ' ');
        } else {
          codeBox.className += ' error';
        }
      }
      if (formatter === null) {
        result = text;
      } else {
        result = formatter(text);
        if (typeof result !== 'string') {
          console.log('user-defined formatter: did not return a string' +
              result);
          result = text;
        }
      }
      return result;
    };
  }

  layerConfiguration = {};

  layerConfiguration.getTesters = function () {
    var container = document.getElementById('testerBox'),
        inputs = container.getElementsByTagName('textarea'),
        testers = [],
        i, tester, error;
    for (i = 0; i < inputs.length; ++i) {
      try {
        tester = eval('(' + inputs[i].value + ')');
      } catch (error) {
        console.log('user-defined tester: syntax error');
        continue;
      }
      if (typeof tester !== 'object') {
        console.log('user-defined tester: not an object');
        continue;
      }
      if (typeof tester.test !== 'function') {
        console.log('user-defined tester: no .test method');
        continue;
      }
      testers.push(tester);
    }
    return testers;
  }

  layerConfiguration.addTester = function (value) {
    var container = document.getElementById('testerBox'),
        deleteButton = document.getElementById('deleteButton'),
        tester = document.createElement('textarea');
    tester.spellcheck = false;
    tester.className = 'tester';
    if (value) {
      tester.value = value;
    }
    container.insertBefore(tester, deleteButton);
  };

  layerConfiguration.addTesterButtons = function () {
    var container = document.getElementById('testerBox'),
        deleteButton = document.createElement('div'),
        newButton = document.createElement('div');
    deleteButton.id = 'deleteButton';
    newButton.id = 'newButton';
    deleteButton.className = newButton.className = 'button';
    deleteButton.innerHTML = '&uarr; delete';
    newButton.innerHTML = 'new &darr;';
    deleteButton.onclick = function () {
      var tester = deleteButton.previousSibling;
      if (tester === null) {
        return;
      }
      container.removeChild(tester);
      tester = deleteButton.previousSibling;
      if (tester === null) {
        deleteButton.className += ' disabled';
      }
    };
    newButton.onclick = function () {
      layerConfiguration.addTester();
      deleteButton.className =
          deleteButton.className.replace(/\s+disabled/, '');
    };
    container.appendChild(deleteButton);
    container.appendChild(newButton);
  };

  layerConfiguration.getPreference = function () {
    var container = document.getElementById('preferRightBox'),
        buttons = container.getElementsByTagName('input');
    return buttons[0].checked ? 'left' : 'right';
  };

  layerConfiguration.setPreference = function (direction) {
    var container = document.getElementById('preferRightBox'),
        buttons = container.getElementsByTagName('input');
    buttons[direction == 'left' ? 0 : 1].checked = true;
  };

  // load sets up the cursor-maintaining formatter for each demo by
  //  calling setMaintainer, then fills the input area with sample content.
  function load() {
    var divs, i, notes, columns, content, snippet;

    // Meta version of commatize accompanied by an input validator.
    setMaintainer(document.getElementById('commatizeInput'),
        CME.meta.commatize, {
          validate: function (text) {
                      return /^[0-9,]*$/.test(text);
                    }
        });
    document.getElementById('commatizeInput').value = '3171814';
    document.getElementById('commatizeInput').click();

    // Meta version of trimify. No input validation.
    setMaintainer(document.getElementById('trimifyInput'),
        CME.meta.trimify);
    document.getElementById('trimifyInput').value =
        "\"Other maps are such shapes, with their islands and capes! / " +
        "   But we've got our brave Captain to thank\" / " +
        "(So the crew would protest) \"that he's bought us the best— / " +
        "   A perfect and absolute blank!\"";
    document.getElementById('trimifyInput').click();

    // Retrospective approach with frequency ratios applied to a
    //  user-defined formatting function. No input validation.
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
    //  No input validation.
    setMaintainer(document.getElementById('layerInput'),
        function () {
            return CM.layer.augmentFormat(
                makeFormatFromInput(document.getElementById('layerCode')),
                layerConfiguration.getTesters(),
                layerConfiguration.getPreference() == 'right');
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
    layerConfiguration.setPreference('left');
    layerConfiguration.addTesterButtons();
    layerConfiguration.addTester('/\\d/');
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
