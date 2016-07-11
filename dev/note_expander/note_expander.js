var NoteExpander = (function () {
  'use strict';

  function makeExpanderAction(button, content) {
    return function () {
      console.log(content.className);
      if (content.className.indexOf('expander-collapsed') == -1) {
        content.className += ' expander-collapsed';
      } else {
        content.className = content.className.replace(
            /\s+expander-collapsed/, '');
      }
    }
  }

  function enable(content, doNotCollapse) {
    var button = document.createElement('div');
    button.className = 'expander-button';
    button.innerHTML = '<span class="expander-icon">&#x22ef;</span>';
    content.className = 'expander-content';
    content.parentNode.insertBefore(button, content);
    button.onclick = makeExpanderAction(button, content);
    button.click();
    if (doNotCollapse) {
      button.click();
    }
  }

  function enableByTagAndClass(root, tag, name, doNotCollapse) {
    var elements, names, i, j;
    elements = root.getElementsByTagName(tag);
    for (i = 0; i < elements.length; ++i) {
      names = elements[i].className.split(/\s+/);
      for (j = 0; j < names.length; ++j) {
        if (names[j] == name) {
          enable(elements[i], doNotCollapse);
        }
      }
    }
  }

  return {
    enable: enable,
    enableByTagAndClass: enableByTagAndClass
  };
})();
