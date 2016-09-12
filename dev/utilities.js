
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

