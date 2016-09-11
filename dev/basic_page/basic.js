var BasicExample = (function () {
  'use strict';

  // requires: cursor_maintainer.js

  // The BasicExample module illustrates how you can use the CursorMaintainer
  //  module to add cursor maintenance to an existing format. We have a
  //  credit card number format implemented in the ccFormat function below.
  //  We use the layer approach to generate a cursor-maintaining formatter.
  //  This is accomplished in the second line of the load function below,
  //  where we call CursorMaintainer.layer.augmentFormat with ccFormat and
  //  an array of regular expressions representing character sets. The
  //  result of this call is a function that takes raw text and a cursor
  //  position; it returns an object containing formatted text and a new
  //  cursor position.

  var ccInput,
      ccMaintainer;

  // ccFormat enforces a display format for credit card numbers. The result
  //  is a sequence of four-digit groups separated by spaces, containing a
  //  maximum of sixteen digits. Examples:
  //  " 123-456-" -> "1234 56"
  //  "12345678901234567890" -> "1234 5678 9012 3456"
  function ccFormat(s) {
    var groups = [],
        i;
    s = s.replace(/\D/g, '');            // Remove all non-digit characters.
    s = s.substring(0, 16);              // Keep no more than 16 digits.
    for (i = 0; i < s.length; i += 4) {  // Make four-digit groups.
      groups.push(s.substring(i, i + 4));
    }
    return groups.join(' ');             // Put spaces between the groups.
  }

  // ccUpdate responds to changes in the state of the input element. This
  //  is a very simple implementation that calls the cursor-maintaining
  //  formatter and uses the return value to update the input value and
  //  cursor position. This particular cursor-maintaining formatter takes
  //  care to check whether the formatted text is equal to the raw text,
  //  and if so, retains the raw cursor position instead of trying to
  //  calculate a new cursor position. If you use a cursor-maintaining
  //  formatter that does not perform this check, do it yourself.
  // Note that you can make ccUpdate more efficient by storing the input
  //  text outside the function and checking at the start of each call
  //  to see if the text has changed since the last call. If it hasn't,
  //  you can immediately return and save the expense of formatting.
  function ccUpdate() {
    var text = ccInput.value,
        cursor = ccInput.selectionStart,
        formatted = ccMaintainer(text, cursor);
    ccInput.value = formatted.text;
    ccInput.setSelectionRange(formatted.cursor, formatted.cursor);
  }

  // load instantiates the cursor-maintaining formatter, attaches event
  //  listeners to the input element, and fills the input element with
  //  initial content.
  // Note that the maxlength attribute of the input element can influence
  //  the effect of user input. In the case of a limited-length input value
  //  like a credit card number, there is a question of what happens when the
  //  input is already at full length and the user inserts a new character.
  //  If maxlength is not set, the text to the left of the new character
  //  is shifted and the final character gets chopped off by the formatter.
  //  If maxlength is set to the maximum length, the input element ignores
  //  the user's attempt to insert one more character.
  function load() {
    ccInput = document.getElementById('ccInput');
    ccMaintainer = CursorMaintainer.layer.augmentFormat(ccFormat, [ /\d/ ]);
    [ 'change', 'keydown', 'keyup', 'click' ].forEach(function (eventName) {
      ccInput.addEventListener(eventName, ccUpdate);
    });
    ccInput.value = '1234567';
    ccInput.click();
    ccInput.focus();
  }

  return {
    load: load
  };
})();

onload = BasicExample.load;
