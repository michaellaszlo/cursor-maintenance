var NoteExpander = (function () {
  'use strict';

  // The NoteExpander module implements expandable notes. Notes of this kind
  //  initially appear in a compact state that shows no more than the first
  //  line of note content. The user must click on a button to expand the
  //  note, revealing its full content. The next click on the button
  //  collapses it into its compact state.
  // This module depends on the style rules in note_expander.css, which must
  //  be loaded to achieve the collapsed state and the expanding effect.
  //  It introduces class names that begin with ".expander-". If you foresee
  //  conflicts with your existing CSS classes, you should choose a unique
  //  prefix and use it to replace all occurrences of ".expander-" in
  //  note_expander.js and note_expander.css.
  // The easiest way to use NoteExpander is to call enableByTagAndClass.
  //  For example, to make expandable notes out of all div elements that have
  //  the class "notes":
  //   NoteExpander.enableByTagAndClass(document, 'div', 'notes');
  //  To do this only for the subtree rooted at the element named article:
  //   NoteExpander.enableByTagAndClass(article, 'div', 'notes');
  //  To make notes that are initially expanded:
  //   NoteExpander.enableByTagAndClass(document, 'div', 'notes', true);

  // makeExpanderAction
  function makeExpanderAction(wrapper, button, content) {
    var fog = document.createElement('div');
    fog.className = 'expander-fog';
    wrapper.appendChild(fog);
    return function () {
      if (wrapper.className.indexOf('expander-collapsed') == -1) {
        wrapper.className += ' expander-collapsed';
        content.style.height = fog.style.height = button.offsetHeight + 'px';
      } else {
        wrapper.className = wrapper.className.replace(
            /\s+expander-collapsed/, '');
        content.style.height = '';
      }
    }
  }

  // enable
  function enable(content, startExpanded) {
    var wrapper = document.createElement('div'),
        button = document.createElement('div');
    button.className = 'expander-button';
    button.innerHTML = '<span class="expander-icon">&#x22ef;</span>';
    content.className = 'expander-content';
    content.parentNode.insertBefore(wrapper, content);
    wrapper.appendChild(content);
    wrapper.appendChild(button);
    button.onclick = makeExpanderAction(wrapper, button, content);
    button.click();
    if (startExpanded) {
      button.click();
    }
  }

  // enableByTagAndClass kkkkkkkkkkkkkkkkk
  function enableByTagAndClass(root, tag, name, startExpanded) {
    var elements, names, i, j;
    elements = root.getElementsByTagName(tag);
    for (i = 0; i < elements.length; ++i) {
      names = elements[i].className.split(/\s+/);
      for (j = 0; j < names.length; ++j) {
        if (names[j] == name) {
          enable(elements[i], startExpanded);
        }
      }
    }
  }

  return {
    enable: enable,
    enableByTagAndClass: enableByTagAndClass
  };
})();
