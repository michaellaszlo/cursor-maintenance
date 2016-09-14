var DOMHelpers = (function () {
  'use strict';

  // The DOMHelpers module is a small collection of functions that help
  //  you build and manipulate web pages more concisely.

  // make is a DOM element factory.
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

  // classRemove modifies the given element's className so that it no longer
  //  includes classes that are equal to the given name.
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
