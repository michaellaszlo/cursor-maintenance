var CursorMaintenanceComparison = (function () {
  var maintainer = CursorMaintainer,
      formatter = maintainer.formatter,
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
          formattedText = formatter[operation](originalText).text;
      // Echo input. Show formatted text without cursor.
      setOutput(outputs[operation].original, originalText, originalCursor);
      setOutput(outputs[operation].formatted, formattedText);
      // Show text formatted with cursor maintenance.
      Object.keys(outputs[operation]).forEach(function (approach) {
        var result;
        if (!(approach in maintainer)) {
          return;
        }
        result = maintainer[approach][operation](originalText, originalCursor);
        setOutput(outputs[operation][approach], result.text, result.cursor);
      });
      if (activeButtons[operation]) {
        activeButtons[operation].click();
      }
      if (activeInputMirror) {
        activeInputMirror.className =
            activeInputMirror.className.replace(/\s*active\s*/g, '');
      }
      activeInputMirror = outputs[operation].original;
      activeInputMirror.className += ' active';
    }
    input.onblur = function () {
      outputs[operation].original.className =
          outputs[operation].original.className.replace(/\s*active\s*/g, '');
    };
    [ 'change', 'keydown', 'keyup', 'click' ].forEach(function (eventName) {
      input['on' + eventName] = react;
    });
  }

  // List all cursor positions and scores for a retrospective approach.
  function enableButton(button, operation, approach) {
    button.onclick = function () {
      var input = inputs[operation],
          text = input.value,
          cursor = input.selectionStart,
          result = maintainer[approach][operation](text, cursor),
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
    [ 'className', 'id', 'innerHTML' ].forEach(function (property) {
      if (property in options) {
        element[property] = options[property];
      }
    });
    if ('parent' in options) {
      options.parent.appendChild(element);
    }
    if ('attributes' in options) {
      options.attributes.forEach(function (attribute) {
        element[attribute.name] = attribute.value;
        console.log(attribute.name, attribute.value);
      });
    }
    return element;
  }

  function load() {
    var table = document.getElementById('comparisons'),
        rows = table.getElementsByTagName('tr'),
        inputRow = document.getElementById('inputs'),
        scoreRow = document.getElementById('scores'),
        operations = [ 'commatize', 'trimify' ],
        maxLengths = { commatize: 20, trimify: 60 },
        i, row, cells, approach;
    // Insert input elements at top, score areas at bottom.
    operations.forEach(function (operation) {
      //inputs[operation] = make('input', { parent:
      //    make('td', { parent: inputRow }) });
      outputs[operation] = {};
      scores[operation] = make('div', { className: 'scoreList', parent:
          make('td', { parent: scoreRow }) });
    });
    // Traverse rows and insert cells with output elements.
    for (i = 0; i < rows.length; ++i) {
      row = rows[i];
      if (row.className.indexOf('outputs') == -1) {
        continue;
      }
      cells = row.getElementsByTagName('td');
      approach = cells[0].innerHTML.replace(/\s+/g, '');
      operations.forEach(function (operation) {
        var button,
            cell = make('td', { parent: row }),
            output = outputs[operation][approach] = make('span',
                { parent: cell, className: 'output' });
        if (approach == 'original') {
          inputs[operation] = make('input', { parent: cell,
              attributes: [ { name: 'type', value: 'text' },
              { name: 'maxLength', value: maxLengths[operation] } ] });
        }
        if (row.className.indexOf('retrospective') != -1) {
          button = make('button', { innerHTML: 'scores', parent: cell });
          enableButton(button, operation, approach);
          output.button = button;
        }
      });
    }
    // Attach input handlers.
    operations.forEach(function (operation) {
      enableInput(inputs[operation], operation);
    });
    // Insert prefabricated data.
    inputs.commatize.value = '12,3,45';
    inputs.commatize.setSelectionRange(3, 3);
    inputs.commatize.click();
    inputs.trimify.value = '   The   quick  brown   fox   jumps  ';
    inputs.trimify.setSelectionRange(7, 7);
    inputs.trimify.click();
    inputs.commatize.focus();
    outputs.commatize.splitLevenshtein.button.click();
    outputs.trimify.splitLevenshtein.button.click();
  }

  return {
    load: load
  };
})();
onload = CursorMaintenanceComparison.load;
