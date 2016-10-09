var BasicCursorMaintenanceDemo = (function () {
  'use strict';

  // requires: cursor_maintenance.js, note_expander.js

  // The BasicCursorMaintenanceDemo module illustrates how you can use the
  //  CursorMaintenance module to add cursor maintenance to an existing
  //  formatter. We have a credit card format implemented below in the
  //  plainFormatter function. We use the layer approach to generate a
  //  cursor-maintaining formatter. This is accomplished in the load function,
  //  where we call CursorMaintenance.layer.augmentFormat with plainFormatter
  //  and an array of regular expressions representing character sets. The
  //  result is a function that takes raw text and a cursor position; it
  //  returns an object containing formatted text and a new cursor position.

  var inputElement,
      cursorMaintainingFormatter;

  // plainFormatter applies a display format to credit card numbers. The result
  //  is a sequence of four-digit groups separated by spaces, containing a
  //  maximum of sixteen digits. Examples:
  //  " 123-456-" -> "1234 56"
  //  "12345678901234567890" -> "1234 5678 9012 3456"
  function plainFormatter(s) {
    var groups = [],
        i;
    s = s.replace(/\D/g, '');            // Remove all non-digit characters.
    s = s.substring(0, 16);              // Keep no more than 16 digits.
    for (i = 0; i < s.length; i += 4) {  // Make four-digit groups.
      groups.push(s.substring(i, i + 4));
    }
    return groups.join(' ');             // Put spaces between the groups.
  }

  // updateInput responds to changes in the state of the input element. It
  //  calls the cursor-maintaining formatter and uses the result to update
  //  the input value and cursor position.
  // Note: We are using a cursor-maintaining formatter that checks whether
  //  the formatted text is equal to the input value, and if so, retains
  //  the current cursor position instead of trying to calculate a new
  //  cursor position. If you use a cursor-maintaining formatter that
  //  does not perform this check, you should do it yourself.
  // Also note: You can make updateInput more efficient by storing the input
  //  value outside the function and checking at the start of each call to
  //  see if the user has changed the text since the last call. If not,
  //  you can immediately return and save the expense of formatting.
  function updateInput() {
    var rawText = inputElement.value,
        rawCursor = inputElement.selectionStart,
        formatted = cursorMaintainingFormatter(rawText, rawCursor);
    inputElement.value = formatted.text;
    inputElement.setSelectionRange(formatted.cursor, formatted.cursor);
  }

  // load instantiates the cursor-maintaining formatter, attaches event
  //  listeners to the input element, and fills the input element with
  //  initial content.
  // Note: The maxlength attribute of the input element may determine the
  //  outcome of a user action. In the case of a fixed-length input value
  //  like a credit card number, there is a question of what happens when the
  //  input is already at full length and the user inserts a new character.
  //  If maxlength is not set, the text to the right of the new character
  //  is shifted right and the final character is truncated by the formatter.
  //  If maxlength is set to the required input length, the input element
  //  ignores the user's attempt to insert one more character.
  function load() {
    cursorMaintainingFormatter =
        CursorMaintenance.layer.augmentFormat(plainFormatter, [ /\d/ ]);
    inputElement = document.getElementById('inputElement');
    [ 'change', 'keydown', 'keyup', 'click' ].forEach(function (eventName) {
      inputElement.addEventListener(eventName, updateInput);
    });
    inputElement.value = '1234567';
    inputElement.click();
    // Collapse the notes above the input element.
    NoteExpander.enableByTagAndClass(document, 'div', 'notes');
  }

  return {
    load: load
  };
})();

onload = BasicCursorMaintenanceDemo.load;
