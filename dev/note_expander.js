var NoteExpander = (function () {
  'use strict';

  // Collapse all notes. Add an expander widget to each note section.
  function makeExpanderAction(notes, columns, content) {
    return function () {
      if (notes.className.indexOf('collapsed') == -1) {
        notes.className = 'notes collapsed';
        columns.content.innerHTML = content.snippet;
      } else {
        notes.className = 'notes';
        columns.content.innerHTML = content.full;
      }
    }
  }

  function enable(notes, doNotCollapse) {
    var columns, content, snippet;
    columns = {
      expander: document.createElement('div'),
      content: document.createElement('div')
    };
    columns.expander.className = 'expander';
    columns.expander.innerHTML = '<span class="icon">&#x22ef;</span>';
    columns.content.className = 'content';
    content = {
      full: notes.innerHTML
    };
    snippet = content.full.replace(/\s*<p>\s*/g, '')
    snippet = '<p>' + snippet.substring(0, snippet.indexOf(' ', 20));
    content.snippet = snippet;
    notes.innerHTML = '';
    notes.insertBefore(columns.content, notes.firstChild);
    notes.insertBefore(columns.expander, notes.firstChild);
    columns.expander.onclick = makeExpanderAction(notes, columns, content);
    if (!doNotCollapse) {
      columns.expander.click();
    }
  }

  return {
    enable: enable
  };
})();
