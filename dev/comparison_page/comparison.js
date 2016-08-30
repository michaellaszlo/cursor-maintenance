var CursorMaintenanceComparison = (function () {
  'use strict';

  var CME = CursorMaintainerExperiments,
      inputMaxLengths = {
        commatize: 15,
        trimify: 60
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

  function setOutput(element, text, cursor) {
    // Note that the range test is false when cursor is null or undefined.
    if (!(cursor >= 0 && cursor <= text.length)) {
      element.innerHTML = text;
      return;
    }
    element.innerHTML = '<span class="start"></span>' +
        text.substring(0, cursor) + '<span class="cursor"></span>' +
        text.substring(cursor);
  }

  function enableInput(input, formatName) {
    function react() {
      var rawText = input.value,
          rawCursor = input.selectionStart,
          formattedText = CME.format[formatName](rawText).text;
      // Echo input. Show formatted text without cursor.
      setOutput(outputs[formatName].before, rawText, rawCursor);
      setOutput(outputs[formatName].after, formattedText);
      // Show text formatted with cursor maintenance.
      Object.keys(outputs[formatName]).forEach(function (approach) {
        var result;
        if (approach in CME) {
          result = CME[approach][formatName](rawText, rawCursor);
          setOutput(outputs[formatName][approach], result.text, result.cursor);
        }
      });
      if (activeButtons[formatName]) {
        activeButtons[formatName].click();
      }
      if (activeInputMirror) {
        activeInputMirror.className =
            activeInputMirror.className.replace(/\s*active\s*/g, '');
      }
      activeInputMirror = outputs[formatName].before;
      activeInputMirror.className += ' active';
    }
    input.onblur = function () {
      outputs[formatName].before.className =
          outputs[formatName].before.className.replace(/\s*active\s*/g, '');
    };
    [ 'change', 'keydown', 'keyup', 'click' ].forEach(function (eventName) {
      input['on' + eventName] = react;
    });
  }

  // List all cursor positions and scores for a retrospective approach.
  function enableScoreButton(button, formatName, approach) {
    button.onclick = function () {
      var input = inputs[formatName],
          text = input.value,
          cursor = input.selectionStart,
          result = CME[approach][formatName](text, cursor),
          container = scores[formatName],
          activeButton = activeButtons[formatName],
          parts = [],
          i, item, output, score;
      container.innerHTML = '';
      for (i = 0; i < result.scores.length; ++i) {
        item = make('div', { parent: container, className: 'scoreItem' });
        if (i == result.cursor) {
          item.className += ' best';
        }
        output = make('span', { className: 'output', parent: item,
            innerHTML: '<span class="start"></span>' +
                result.text.substring(0, i) + '<span class="cursor"></span>' +
                result.text.substring(i) });
        output.style.width = '250px';
        score = ' ' + result.scores[i];
        if (score.indexOf('.') != -1) {
          score = score.substring(0, score.indexOf('.') + 6);
        }
        make('span', { parent: item, className: 'score', innerHTML: score });
      }
      if (activeButton && activeButton != button) {
        activeButton.className =
            activeButton.className.replace(/\s*active\s*/g, '');
      }
      activeButtons[formatName] = button;
      button.className += ' active';
    };
  }

  function make(tag, options) {
    var element = document.createElement(tag);
    if ('parent' in options) {
      options.parent.appendChild(element);
      delete options.parent;
    }
    Object.keys(options).forEach(function (key) {
      element[key] = options[key];
    });
    return element;
  }

  function makeApproachName(s) {
    var parts = s.replace(/^\s+|\s+$/g, '').split(/\s+/),
        i, name;
    for (i = 1; i < parts.length; ++i) {
      parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].substring(1);
    }
    name = parts.join('');
    return name;
  }

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
      scores[formatName] = make('div', { className: 'scoreList', parent:
          make('td', { parent: scoreRow }) });
    });
    // Traverse rows, adding cells. Insert inputs at top, outputs everywhere.
    for (i = 0; i < rows.length; ++i) {
      row = rows[i];
      if (row.className.indexOf('outputs') == -1) {
        continue;
      }
      cells = row.getElementsByTagName('td');
      approach = makeApproachName(cells[0].innerHTML);
      formatNames.forEach(function (formatName) {
        var button,
            cell = make('td', { parent: row }),
            output = outputs[formatName][approach] = make('span',
                { parent: cell, className: 'output' });
        if (approach == 'before') {
          inputs[formatName] = make('input', { parent: cell, type: 'text',
              spellcheck: false,
              maxLength: inputMaxLengths[formatName] });
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
    // Insert prefabricated data.
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
