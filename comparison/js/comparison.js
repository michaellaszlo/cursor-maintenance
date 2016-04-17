var CursorMaintenanceComparison = (function () {
  var maintainer = CursorMaintainer,
      formatter = maintainer.formatter,
      inputs = {},
      outputs = {};

  function handleInput(element, handler) {
    [ 'change', 'keydown', 'keyup', 'click' ].forEach(function (eventName) {
      element['on' + eventName] = function () {
        var text = element.value,
            cursor = element.selectionStart;
        handler(text, cursor);
      };
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
    operations.forEach(function (operation) {
      inputs[operation] = make('input', { parent:
          make('td', { parent: inputRow }) });
    });
    handleInput(inputs.commatize, function (originalText, originalCursor) {
      var formattedText = formatter.commatize(originalText).text;
      console.log('commatize: "' + originalText + '", ' + originalCursor +
          '  ->  "' + formattedText + '" ');
    });
    outputs = {
      commatize: {},
      trimify: {}
    };
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
        outputs[operation][kind] = make('span', { parent: cell });
        if (row.className.indexOf('retrospective') != -1) {
          make('button', { innerHTML: 'scores', parent: cell });
        }
      });
    }
  }

  return {
    load: load
  };
})();
onload = CursorMaintenanceComparison.load;
