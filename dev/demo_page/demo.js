var CursorMaintenanceDemo = (function () {

  function commatizeValidator(text) {
    return /^[0-9,]*$/.test(text);
  }

  function setFormatter(input, format, validate) {
    var eventNames = [ 'change', 'keydown', 'keyup', 'click' ],
        previous = { text: '', cursor: 0 },
        toggleBox = document.createElement('div'),
        i;
    function respond() {
      var text = input.value,
          cursor = input.selectionStart,
          formatted;
      if (text === previous.text) {
        previous.cursor = cursor;
        return;
      }
      if (!validate || validate(text) === true) {
        previous = formatted = format(text, cursor);
      } else {
        formatted = { text: previous.text, cursor: previous.cursor };
      }
      input.value = formatted.text;
      input.setSelectionRange(formatted.cursor, formatted.cursor);
    }
    for (i = 0; i < eventNames.length; ++i) {
      input.addEventListener(eventNames[i], respond);
    }
    toggleBox.innerHTML = '<span class="toggle active">formatting on</span>';
    input.parentNode.insertBefore(toggleBox, input);
  }

  function load() {
    setFormatter(document.getElementById('commatizeInput'),
        CursorMaintainer.meta.commatize, commatizeValidator);
    setFormatter(document.getElementById('trimifyInput'),
        CursorMaintainer.meta.trimify);
  }

  return {
    load: load
  };
})();

onload = CursorMaintenanceDemo.load;
