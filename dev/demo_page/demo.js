var CursorMaintenanceDemo = (function () {
  var messages = {
        formatting: {
          off: '<span class="icon">&#x2610;</span>formatting disabled',
          on: '<span class="icon">&#x2611;</span>formatting on'
        }
      };

  function getCursorPosition(input) {
    return input.selectionStart;
  }

  function setCursorPosition(input, position) {
    input.setSelectionRange(position, position);
  }

  function setFormatter(input, format, validate) {
    var saved = { text: '', cursor: 0 },
        formatted,
        toggleBox;
    function processInput() {
      var text,
          cursor,
          formatted;
      text = input.value;
      cursor = getCursorPosition(input);
      // If the input is invalid, restore the saved state and bail out.
      if (validate !== undefined && validate(text) !== true) {
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
      formatted = format(text, cursor);
      // If formatting leaves the user text unchanged, accept the user cursor.
      if (formatted.text === text) {
        saved.cursor = cursor;
        return;
      }
      input.value = saved.text = formatted.text;
      setCursorPosition(input, saved.cursor = formatted.cursor);
    }
    // Add an element that allows the user to toggle formatting on and off.
    input.status = { formatting: false };
    toggleBox = document.createElement('div');
    toggleBox.className = 'toggle';
    toggleBox.onclick = function () {
      if (!input.status.formatting) {
        input.status.formatting = true;
        this.className += ' active';
        toggleBox.innerHTML = messages.formatting.on;
        input.focus();
        processInput();
      } else {
        input.status.formatting = false;
        this.className = this.className.replace(/\s*active\s*/, ' ');
        toggleBox.innerHTML = messages.formatting.off;
      }
    };
    toggleBox.click();
    input.parentNode.insertBefore(toggleBox, input);
    // Listen for events that can change the input value.
    [ 'change', 'keydown', 'keyup', 'click' ].forEach(function (eventName) {
      input.addEventListener(eventName, processInput);
    });
  }

  function commatizeValidator(text) {
    return /^[0-9,]*$/.test(text);
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
