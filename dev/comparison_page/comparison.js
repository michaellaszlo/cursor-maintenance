var CursorMaintenanceComparison = (function () {
  var CM = CursorMaintainer,
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

  function enableInput(input, operation) {
    function react() {
      var originalText = input.value,
          originalCursor = input.selectionStart,
          formattedText = CM.format[operation](originalText).text,
          maintainer;
      // Echo input. Show formatted text without cursor.
      setOutput(outputs[operation].userText, originalText, originalCursor);
      setOutput(outputs[operation].formattedText, formattedText);
      // Show text formatted with cursor maintenance.
      Object.keys(outputs[operation]).forEach(function (approach) {
        var result;
        if (approach in CM) {
          maintainer = CM[approach][operation];
        } else {
          return;
        }
        result = maintainer(originalText, originalCursor);
        setOutput(outputs[operation][approach], result.text, result.cursor);
      });
      if (activeButtons[operation]) {
        activeButtons[operation].click();
      }
      if (activeInputMirror) {
        activeInputMirror.className =
            activeInputMirror.className.replace(/\s*active\s*/g, '');
      }
      activeInputMirror = outputs[operation].userText;
      activeInputMirror.className += ' active';
    }
    input.onblur = function () {
      outputs[operation].userText.className =
          outputs[operation].userText.className.replace(/\s*active\s*/g, '');
    };
    [ 'change', 'keydown', 'keyup', 'click' ].forEach(function (eventName) {
      input['on' + eventName] = react;
    });
  }

  // List all cursor positions and scores for a retrospective approach.
  function enableScoreButton(button, operation, approach) {
    button.onclick = function () {
      var input = inputs[operation],
          text = input.value,
          cursor = input.selectionStart,
          result = CM[approach][operation](text, cursor),
          container = scores[operation],
          item,
          activeButton = activeButtons[operation],
          parts = [],
          i, output;
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
        make('span', { parent: item, className: 'score',
            innerHTML: ' ' + result.scores[i] });
      }
      if (activeButton && activeButton != button) {
        activeButton.className =
            activeButton.className.replace(/\s*active\s*/g, '');
      }
      activeButtons[operation] = button;
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

  function makeApproachName(s, isRetrospective) {
    var parts = s.replace(/^\s+|\s+$/g, '').split(/\s+/),
        i, name;
    for (i = 1; i < parts.length; ++i) {
      parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].substring(1);
    }
    name = parts.join('');
    //if (isRetrospective) {
    //  name = 'retro
    return name;
  }

  function load() {
    var table = document.getElementById('comparisons'),
        rows = table.getElementsByTagName('tr'),
        inputRow = document.getElementById('inputs'),
        scoreRow = document.getElementById('scores'),
        operations = [ 'commatize', 'trimify' ],
        i, row, cells,
        approach, isRetrospective;
    operations.forEach(function (operation) {
      outputs[operation] = {};
      scores[operation] = make('div', { className: 'scoreList', parent:
          make('td', { parent: scoreRow }) });
    });
    // Traverse rows, adding cells. Insert inputs at top, outputs everywhere.
    for (i = 0; i < rows.length; ++i) {
      row = rows[i];
      if (row.className.indexOf('outputs') == -1) {
        continue;
      }
      cells = row.getElementsByTagName('td');
      isRetrospective = (row.className.indexOf('retrospective') != -1);
      approach = makeApproachName(cells[0].innerHTML, isRetrospective);
      operations.forEach(function (operation) {
        var button,
            cell = make('td', { parent: row }),
            output = outputs[operation][approach] = make('span',
                { parent: cell, className: 'output' });
        if (approach == 'userText') {
          inputs[operation] = make('input', { parent: cell, type: 'text',
              spellcheck: false,
              maxLength: inputMaxLengths[operation] });
          output.className += ' original';
          cell.style.minWidth = cellMinWidths[operation] + 'px';
        }
        if (isRetrospective) {
          button = make('button', { innerHTML: 'scores', parent: cell });
          enableScoreButton(button, operation, approach);
          output.button = button;
        }
      });
    }
    // Attach input handlers.
    operations.forEach(function (operation) {
      enableInput(inputs[operation], operation);
    });
    // Insert prefabricated data.
    inputs.commatize.value = '129,00';
    inputs.commatize.setSelectionRange(4, 4);
    inputs.commatize.click();
    inputs.trimify.value = '    \'Twas   brillig,  and  ';
    inputs.trimify.setSelectionRange(10, 10);
    inputs.trimify.click();
    outputs.commatize.balancedFrequencies.button.click();
    outputs.trimify.balancedFrequencies.button.click();

    // Add expander to notes (collapsed by default).
    NoteExpander.enableByTagAndClass(document, 'div', 'notes');
  }

  return {
    load: load
  };
})();
onload = CursorMaintenanceComparison.load;
