var WebUtilities = (function () {
  'use strict';

  var NoteExpander;

  // make is a factory for DOM elements.
  // tag: The name of an HTML tag.
  // options: An object containing name-value pairs for HTML tag attributes.
  //  Attribute values are assigned directly to the newly created element.
  //  options can also include the special key 'parent', pointing to a live
  //  DOM node to which we append the new element.
  function make(tag, options) {
    var element = document.createElement(tag);
    if ('parent' in options) {
      options.parent.appendChild(element);
      delete options.parent;
    }
    Object.keys(options).forEach(function (key) {
      element[key] = options[key];
    });
    return element;
  }

  function classRemove(element, name) {
    var names = element.className.replace(/^\s+|\s+$/g, '').split(/\s+/),
        newNames = [],
        i;
    for (i = 0; i < names.length; ++i) {
      if (names[i] != name) {
        newNames.push(names[i]);
      }
    }
    element.className = newNames.join(' ');
  }

  // NoteExpander
  NoteExpander = {};

  NoteExpander.makeExpanderAction = function (wrapper, button, content) {
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
  };

  NoteExpander.enable = function (content, notCollapsed) {
    var wrapper = document.createElement('div'),
        button = document.createElement('div');
    button.className = 'expander-button';
    button.innerHTML = '<span class="expander-icon">&#x22ef;</span>';
    content.className = 'expander-content';
    content.parentNode.insertBefore(wrapper, content);
    wrapper.appendChild(content);
    wrapper.appendChild(button);
    button.onclick = NoteExpander.makeExpanderAction(wrapper, button, content);
    button.click();
    if (notCollapsed) {
      button.click();
    }
  };

  NoteExpander.enableByTagAndClass = function (root, tag, name, notCollapsed) {
    var elements, names, i, j;
    elements = root.getElementsByTagName(tag);
    for (i = 0; i < elements.length; ++i) {
      names = elements[i].className.split(/\s+/);
      for (j = 0; j < names.length; ++j) {
        if (names[j] == name) {
          NoteExpander.enable(elements[i], notCollapsed);
        }
      }
    }
  };


  return {
    make: make,
    classRemove: classRemove,
    NoteExpander: NoteExpander
  };
})();
