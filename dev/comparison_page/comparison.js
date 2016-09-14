var CursorMaintenanceComparison = (function () {
  'use strict';

  // requires: cursor_maintainer_experiments.js
  //           dom_helpers.js
  //           note_expander.js

  // CursorMaintenanceComparison powers a web page that displays a table
  //  of results from several cursor-maintenance implementations applied
  //  in parallel to a formatting instance. There is one formatting
  //  instance for each of two formats, commatize and trimify. A table
  //  column is dedicated to each format. The various cursor-maintenance
  //  approaches correspond to rows. Each formatting instance can be
  //  edited by the user, and the results are immediately updated to
  //  reflect changes in the raw text or cursor position.

  var CME = CursorMaintainerExperiments,
      make = DOMHelpers.make,
      classRemove = DOMHelpers.classRemove,
      inputMaxLengths = {  // Maximum number of input characters for each
        commatize: 15,     //  format. These values are used to set the
        trimify: 60        //  maxlength attribute of the input element.
      },
      cellMinWidths = {
        commatize: 200,
        trimify: 600
      },
      inputs = {},
      outputs = {},
      activeButtons = {},
      activeInputMirror,
      scores = {};

  // setOutput displays a cursor-maintenance result in an output element.
  function setOutput(element, text, cursor) {
    // The range test evaluates to false when cursor is null or undefined.
    if (!(cursor >= 0 && cursor <= text.length)) {
      element.innerHTML = text;
      return;
    }
    // Indicate the cursor position with a specially styled span. The start
    //  span makes the cursor span visible at position 0.
    element.innerHTML = '<span class="start"></span>' +
        text.substring(0, cursor) + '<span class="cursor"></span>' +
        text.substring(cursor);
  }

  // enableInput builds a handler for events in the input field for each
  //  format. The input element is hidden behind an output box that contains
  //  a graphical cursor. When the input element has focus, the output box
  //  is active, giving it special styling with a blinking cursor. In addition
  //  to managing the active output box, we have to format the text with the
  //  plain formatter and with all the cursor-maintaining formatters, and
  //  display the results in the table.
  function enableInput(input, formatName) {
    var formatter = CME.format[formatName],  // This is the plain formatter.
        formatOutputs = outputs[formatName];
    // update responds to any event that has the potential to change the
    //  input text.
    function update() {
      var rawText = input.value,
          rawCursor = input.selectionStart,
          formattedText = formatter(rawText).text;  // Plain formatting.
      // Display the formatted text without a cursor.
      setOutput(formatOutputs.after, formattedText);
      // Mirror the raw text in the output box directly over the input.
      setOutput(formatOutputs.before, rawText, rawCursor);
      // Deactivate the previously active input-mirroring output box.
      if (activeInputMirror) {
        classRemove(activeInputMirror, 'active');
      }
      // Activate the current input-mirroring output box.
      activeInputMirror = formatOutputs.before;
      activeInputMirror.className += ' active';
      // Run every cursor-maintaining formatter and display the results.
      Object.keys(formatOutputs).forEach(function (approach) {
        var result;
        if (approach in CME) {
          result = CME[approach][formatName](rawText, rawCursor);
          setOutput(formatOutputs[approach], result.text, result.cursor);
        }
      });
      // Update the score display for the retrospective approach whose
      //  score button is currently active.
      if (activeButtons[formatName]) {
        activeButtons[formatName].click();
      }
    }
    // When the input loses focus, deactivate its input-mirroring output box.
    input.onblur = function () {
      classRemove(formatOutputs.before, 'active');
    };
    // Attach update for events that can change the raw text.
    [ 'change', 'keydown', 'keyup', 'click' ].forEach(function (eventName) {
      input.addEventListener(eventName, update);
    });
  }

  // enableScoreButton builds a click handler for a score button that
  //  was made for a particular format and cursor-maintenance approach,
  //  as named by arguments. The format and approach names are used to
  //  look up the appropriate cursor-maintenance method and DOM elements.
  //  The response to a click is to generate a list of scores calculated
  //  for every cursor position by a retrospective cost function, and to
  //  display these in the score area at the bottom of the table column.
  function enableScoreButton(button, formatName, approachName) {
    var maintainer = CME[approachName][formatName],
        scoreArea = scores[formatName],
        input = inputs[formatName];
    button.onclick = function () {
      var text = input.value,
          cursor = input.selectionStart,
          result = maintainer(text, cursor),
          activeButton = activeButtons[formatName],
          i, item, output, score;
      scoreArea.innerHTML = '';
      for (i = 0; i < result.scores.length; ++i) {
        // Make a separate div for each cursor position.
        item = make('div', { parent: scoreArea, className: 'scoreItem' });
        if (i == result.cursor) {
          item.className += ' best';
        }
        output = make('span', { className: 'output', parent: item });
        setOutput(output, result.text, i);
        output.style.width = '250px';
        score = ' ' + result.scores[i];
        // Whole values don't get a decimal point. Display fractional values
        //  with up to six decimal digits.
        if (score.indexOf('.') != -1) {
          score = score.substring(0, score.indexOf('.') + 6);
        }
        make('span', { parent: item, className: 'score', innerHTML: score });
      }
      // The currently active score button gets special styling. When a
      //  different button is activated, alter the class name of the
      //  previously active button to remove the styling.
      if (activeButton && activeButton != button) {
        classRemove(activeButton, 'active');
      }
      activeButtons[formatName] = button;
      button.className += ' active';
    };
  }

  // makeApproachName takes label text extracted from the HTML table and
  //  and transforms it into the name of a member of the cursor-maintenance
  //  module. Examples:
  // "ad hoc" -> "adHoc" (a cursor-maintenance implementation)
  // "frequency ratios" -> "frequencyRatios"  (a retrospective cost function)
  function makeApproachName(s) {
    var parts = s.replace(/^\s+|\s+$/g, '').split(/\s+/),
        i, name;
    for (i = 1; i < parts.length; ++i) {
      parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].substring(1);
    }
    name = parts.join('');
    return name;
  }

  // load fills out a table that is initially defined in the static HTML
  //  in skeletal form, with single-cell rows that each contain the name
  //  of a cursor-maintenance approach. The names are extracted from the
  //  HTML and used to build result fields. Score buttons are built for
  //  rows that have the word "retrospective" in their class name. Input
  //  areas are built at the top of each column, and score displays are
  //  built at the bottom. The format names and approach names in the HTML
  //  are used to look up functions in the cursor-maintenance module.
  function load() {
    var table = document.getElementById('comparisons'),
        rows = table.getElementsByTagName('tr'),
        inputRow = document.getElementById('inputs'),
        scoreRow = document.getElementById('scores'),
        formatNames = [ 'commatize', 'trimify' ],
        i, row, cells,
        approach;
    formatNames.forEach(function (formatName) {
      outputs[formatName] = {};
      // Build the score displays in advance so that we'll be able to connect
      //  score buttons to displays as we traverse the table.
      scores[formatName] = make('div', { className: 'scoreList', parent:
          make('td', { parent: scoreRow }) });
    });
    // Traverse all rows in one shot, filling out cells as we go. Use
    //  class names to decide what to build for each row.
    for (i = 0; i < rows.length; ++i) {
      row = rows[i];
      // Don't do anything for table headers and score displays.
      if (row.className.indexOf('outputs') == -1) {
        continue;
      }
      // Extract the approach name from the first cell in the row.
      cells = row.getElementsByTagName('td');
      approach = makeApproachName(cells[0].innerHTML);
      // Build cells for each format. Most cells only get an output field.
      //  The top row, labeled "before", also gets an input field that
      //  hides behind the output field (which will contain a fancy graphical
      //  cursor). Retrospective result rows get a score button next to
      //  the output field.
      formatNames.forEach(function (formatName) {
        var button,
            cell = make('td', { parent: row }),
            output = outputs[formatName][approach] = make('span',
                { parent: cell, className: 'output' });
        if (approach == 'before') {
          inputs[formatName] = make('input', { parent: cell, type: 'text',
              spellcheck: false,
              maxlength: inputMaxLengths[formatName] });
          output.className += ' raw';
          cell.style.minWidth = cellMinWidths[formatName] + 'px';
        }
        if (row.className.indexOf('retrospective') != -1) {
          button = make('button', { innerHTML: 'scores', parent: cell });
          enableScoreButton(button, formatName, approach);
          output.button = button;
        }
      });
    }
    // Attach input handlers.
    formatNames.forEach(function (formatName) {
      enableInput(inputs[formatName], formatName);
    });
    // Make initial data.
    inputs.commatize.value = '129,00';
    inputs.commatize.setSelectionRange(4, 4);
    inputs.commatize.click();
    inputs.trimify.value = '    \'Twas   brillig,  and  ';
    inputs.trimify.setSelectionRange(10, 10);
    inputs.trimify.click();
    outputs.commatize.frequencyRatios.button.click();
    outputs.trimify.frequencyRatios.button.click();

    // Add expander to notes (collapsed by default).
    NoteExpander.enableByTagAndClass(document, 'div', 'notes');
  }

  return {
    load: load
  };
})();
onload = CursorMaintenanceComparison.load;
