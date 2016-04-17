var CursorMaintenanceComparison = (function () {
  var maintainer = CursorMaintainer,
      formatter = maintainer.formatter,
      inputs = {},
      outputs = {};

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

  function handleInput(input, operation) {
    function react() {
      var originalText = input.value,
          originalCursor = input.selectionStart,
          formattedText = formatter[operation](originalText).text;
      setOutput(outputs[operation].original, originalText, originalCursor);
      setOutput(outputs[operation].formatted, formattedText);
    }
    [ 'change', 'keydown', 'keyup', 'click' ].forEach(function (eventName) {
      input['on' + eventName] = react;
    });
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
    return element;
  }

  function load() {
    var table = document.getElementById('comparisons'),
        rows = table.getElementsByTagName('tr'),
        inputRow = document.getElementById('inputs'),
        operations = [ 'commatize', 'trimify' ],
        i, row, cells, cell, kind;
    // Insert input elements at top of table.
    operations.forEach(function (operation) {
      inputs[operation] = make('input', { parent:
          make('td', { parent: inputRow }) });
      outputs[operation] = {};
    });
    // Traverse rows and insert cells with output elements.
    for (i = 0; i < rows.length; ++i) {
      row = rows[i];
      cells = row.getElementsByTagName('td');
      kind = cells[0].innerHTML.replace(/\s+/g, '');
      if (row.className.indexOf('outputs') == -1) {
        continue;
      }
      console.log(kind);
      operations.forEach(function (operation) {
        cell = make('td', { parent: row });
        outputs[operation][kind] = make('span',
            { parent: cell, className: 'output' });
        if (row.className.indexOf('retrospective') != -1) {
          make('button', { innerHTML: 'scores', parent: cell });
        }
      });
    }
    // Attach input handlers.
    operations.forEach(function (operation) {
      handleInput(inputs[operation], operation);
    });
  }

  return {
    load: load
  };
})();
onload = CursorMaintenanceComparison.load;
