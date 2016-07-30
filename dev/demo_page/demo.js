var CursorMaintenanceDemo = (function () {
  'use strict';

  // This module requires CursorMaintainer and NoteExpander.

  var messages = {
        formatting: {
          off: '<span class="icon">&#x25a1;</span>formatting off',
          on: '<span class="icon">&#x25a0;</span>formatting on'
        }
      };

  function getCursorPosition(input) {
    return input.selectionStart;
  }

  function setCursorPosition(input, position) {
    input.setSelectionRange(position, position);
  }

  function setMaintainer(input, format, options) {
    var formatted,
        toggleBox,
        validate = null,
        makeFormat = false,
        saved = { text: null, cursor: 0 };
    if (options && typeof options == 'object') {
      if ('validate' in options) {
        validate = options.validate;
      }
      if ('makeFormat' in options) {
        makeFormat = options.makeFormat;
      }
    }
    function processInput() {
      var text,
          cursor,
          formatted;
      text = input.value;
      cursor = getCursorPosition(input);
      // If the input is invalid, restore the saved state and bail out.
      if (validate !== null && validate(text) !== true) {
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
      input.value = saved.text = formatted.text;
      setCursorPosition(input, saved.cursor = formatted.cursor);
    }
    // Listen for events that can change the input value.
    [ 'change', 'keydown', 'keyup', 'click' ].forEach(function (eventName) {
      input.addEventListener(eventName, processInput);
    });
    // Add an element that allows the user to toggle formatting on and off.
    input.status = { formatting: false };
    toggleBox = document.createElement('div');
    toggleBox.className = 'toggle';
    toggleBox.onclick = function () {
      if (!input.status.formatting) {
        saved.text = null;
        input.status.formatting = true;
        this.className += ' active';
        toggleBox.innerHTML = messages.formatting.on;
        processInput();
      } else {
        input.status.formatting = false;
        this.className = this.className.replace(/\s*active\s*/, ' ');
        toggleBox.innerHTML = messages.formatting.off;
      }
      input.focus();
    };
    toggleBox.click();
    input.parentNode.insertBefore(toggleBox, input);
  }

  function commatizeValidator(text) {
    return /^[0-9,]*$/.test(text);
  }

  // makeFormatterFromInput reads user input from codeBox and evaluates it
  //  as JavaScript. It is generally thought to be unwise to evaluate
  //  user-provided code. In our case, the code is evaluated in the
  //  browser session in which the user entered the code. This incurs the
  //  same level of risk as the user executing arbitrary code in the
  //  browser's JavaScript console. In both cases, the code is entered
  //  voluntarily by the user and is executed only in the user's browser.
  function makeFormatterFromInput(codeBox) {
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
        result =  text;
      } else {
        result = formatter(text);
        if (typeof result !== 'string') {
          console.log('user-defined formatter: did not return a string' +
              result);
          result = text;
        }
      }
      return { text: result };
    };
  }

  function getTesters() {
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

  function addTester(value) {
    var container = document.getElementById('testerBox'),
        deleteButton = document.getElementById('deleteButton'),
        tester = document.createElement('textarea');
    tester.spellcheck = false;
    tester.className = 'tester';
    if (value) {
      tester.value = value;
    }
    container.insertBefore(tester, deleteButton);
  }

  function addTesterButtons() {
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
      addTester();
      deleteButton.className =
          deleteButton.className.replace(/\s+disabled/, '');
    };
    container.appendChild(deleteButton);
    container.appendChild(newButton);
  }

  function getPreferRight() {
    var container = document.getElementById('preferRightBox'),
        buttons = container.getElementsByTagName('input');
    return buttons[1].checked;
  }

  function load() {
    var divs, i, notes, columns, content, snippet;

    // Meta version of commatize accompanied by an input validator.
    setMaintainer(document.getElementById('commatizeInput'),
        CursorMaintainer.meta.commatize, { validate: commatizeValidator });

    // Meta version of trimify. No input validation.
    setMaintainer(document.getElementById('trimifyInput'),
        CursorMaintainer.meta.trimify);

    // Retrospective approach with balanced frequencies applied to a
    //  user-defined formatting function. No input validation.
    setMaintainer(document.getElementById('retrospectiveInput'),
        CursorMaintainer.retrospective.make(
            makeFormatterFromInput(
                document.getElementById('retrospectiveCode')),
            CursorMaintainer.cost.balancedFrequencies));

    // Layer approach applied to a user-defined formatting function.
    //  No input validation.
    setMaintainer(document.getElementById('layerInput'),
        function () {
            return CursorMaintainer.layer.make(
                makeFormatterFromInput(document.getElementById('layerCode')),
                getTesters(),
                getPreferRight())
        }, { makeFormat: true });

    // Fill input and code box with sample content.
    document.getElementById('commatizeInput').value = '3171814';
    document.getElementById('commatizeInput').click();
    document.getElementById('trimifyInput').value =
        "\"Other maps are such shapes, with their islands and capes! / " +
        "   But we've got our brave Captain to thank\" / " +
        "(So the crew would protest) \"that he's bought us the best— / " +
        "   A perfect and absolute blank!\"";
    document.getElementById('trimifyInput').click();
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
        "}"
    document.getElementById('retrospectiveInput').value = '29031.925';
    document.getElementById('retrospectiveInput').click();
    document.getElementById('layerCode').value =
        document.getElementById('retrospectiveCode').value;
    addTesterButtons();
    addTester('/\\d+/');
    addTester();
    document.getElementById('layerInput').value =
        document.getElementById('retrospectiveInput').value;
    document.getElementById('layerInput').click();
    document.getElementById('layerInput').blur();

    // The page position may have been changed by focus events as the input
    //  fields were initialized. Let's reset to the upper left corner.
    //scrollTo(0, 0);

    // Add expander widgets to note sections. Notes are collapsed by default.
    NoteExpander.enableByTagAndClass(document, 'div', 'notes');
  }

  return {
    load: load
  };
})();

onload = CursorMaintenanceDemo.load;
