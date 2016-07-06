var NoteExpander = (function () {
  'use strict';

  // Collapse all notes. Add an expander widget to each note section.
  function makeExpanderAction(container, columns, content) {
    return function () {
      if (container.className.indexOf('expander-collapsed') == -1) {
        container.className += ' expander-collapsed';
        columns.content.innerHTML = content.snippet;
      } else {
        container.className = container.className.replace(
            /\s+expander-collapsed/, '');
        columns.content.innerHTML = content.full;
      }
    }
  }

  function enable(container, doNotCollapse) {
    var columns, content, snippet;
    columns = {
      button: document.createElement('div'),
      content: document.createElement('div')
    };
    columns.button.className = 'expander-button';
    columns.button.innerHTML = '<span class="expander-icon">&#x22ef;</span>';
    columns.content.className = 'expander-content';
    content = {
      full: container.innerHTML
    };
    snippet = content.full.replace(/\s*<p>\s*/g, '')
    snippet = '<p>' + snippet.substring(0, snippet.indexOf(' ', 20));
    content.snippet = snippet;
    container.innerHTML = '';
    container.insertBefore(columns.content, container.firstChild);
    container.insertBefore(columns.button, container.firstChild);
    columns.button.onclick = makeExpanderAction(container, columns, content);
    columns.button.click();
    if (doNotCollapse) {
      columns.button.click();
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
