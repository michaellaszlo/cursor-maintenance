var DOMHelpers = (function () {
  'use strict';

  // The DOMHelpers module is a small collection of functions that help to
  //   build and manipulate DOM elements.

  // make is a DOM element factory.
  // tag: Names a type of DOM element.
  // options: An object containing DOM attribute-value pairs. These values
  //  are assigned to the newly created object. For example, if the value of
  //  options.className is 'button active', the className of the new object
  //  is set to 'button active'. There is one special key, 'parent': If you
  //  use it, the new object is appended as a child element of options.parent.
  function make(tag, options) {
    var element = document.createElement(tag);
    if (typeof options !== 'object') {
      return;
    }
    if ('parent' in options) {
      options.parent.appendChild(element);
      delete options.parent;
    }
    Object.keys(options).forEach(function (key) {
      element[key] = options[key];
    });
    return element;
  }

  // classRemove modifies the given element's className so that it no longer
  //  includes the class named by the second argument.
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


  return {
    make: make,
    classRemove: classRemove
  };
})();
