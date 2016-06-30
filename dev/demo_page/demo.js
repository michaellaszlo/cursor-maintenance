var CursorMaintenanceDemo = (function () {
  var messages = {
        formatting: {
          off: '<span class="icon">&#x2610;</span>formatting disabled',
          on: '<span class="icon">&#x2611;</span>formatting on'
        }
      };

  function commatizeValidator(text) {
    return /^[0-9,]*$/.test(text);
  }

  function setFormatter(input, format, validate) {
    var eventNames = [ 'change', 'keydown', 'keyup', 'click' ],
        previous = { text: '', cursor: 0 },
        toggleBox = document.createElement('div'),
        i;
    function respond() {
      var text,
          cursor,
          formatted;
      console.log(input.status.formatting);
      if (!input.status.formatting) {
        return;
      }
      text = input.value;
      cursor = input.selectionStart;
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
    input.status = { formatting: false };
    toggleBox.className = 'toggle';
    toggleBox.onclick = function () {
      if (!input.status.formatting) {
        input.status.formatting = true;
        this.className += ' active';
        toggleBox.innerHTML = messages.formatting.on;
      } else {
        input.status.formatting = false;
        this.className = this.className.replace(/\s*active\s*/, ' ');
        toggleBox.innerHTML = messages.formatting.off;
      }
    };
    toggleBox.click();
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
