var CursorMaintenanceComparison = (function () {
  var maintainer = CursorMaintainer,
      formatter = maintainer.formatter,
      inputs,
      outputs;

  function load() {
    var inputRow = document.getElementById('inputs'),
        inputElements = inputRow.getElementsByTagName('input');
    inputs = {
      commatize: inputElements[0],
      trimify: inputElements[1]
    };
    inputs.commatize.onkeyup = function () {
      var original = inputs.commatize.value,
          formatted = formatter.commatize('formatted').text;
      console.log('original "' + original + '"');
      console.log('formatted "' + formatted + '"');
    };
    outputs = {
      commatize: {},
      trimify: {}
    };
  }

  return {
    load: load
  };
})();
onload = CursorMaintenanceComparison.load;
