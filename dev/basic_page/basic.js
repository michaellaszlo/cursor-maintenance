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

  // ccUpdate
  function ccUpdate() {
    var text = ccInput.value,
        cursor = ccInput.selectionStart,
        formatted = ccMaintainer(text, cursor);
    ccInput.value = formatted.text;
    ccInput.setSelectionRange(formatted.cursor, formatted.cursor);
  }

  // load instantiates the cursor-maintaining formatter, attaches event
  //  listeners to the input element, and fills the input element with
  //  some initial content.
  // Note that the input element can
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
