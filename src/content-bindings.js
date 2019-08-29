import ko from 'knockout';
import is from './is';
import $ from 'sizzle';

/**
 * Get the content accesor for the content binding if it has the 'virtual'
 * modified specified
 * @param {BindingContext} context Binding context
 * @param {any} value Value of the binding
 * @return {object} Accesor to use on the template binding
 */
function getContentAccesorForVirtualNode(context, value) {
  // Init the result array of nodes and the number of coincidences
  const result = [];
  let found = 0;

  // Iterate each node in the componentTemplateNodes
  for (let i = 0; i < context.$componentTemplateNodes.length; i++) {
    // Get the node
    const node = context.$componentTemplateNodes[i];
    const nodeValue = node.nodeValue.trim().toUpperCase();
    const upperCaseValue = value.toUpperCase();

    // If the node is virtual and node name and value coincides mark as a
    // found and this and next nodes will be part of the result
    if (node.nodeType == 8) {
      if (nodeValue == upperCaseValue) {
        found++;
      }
    }

    // If an opening tag is found then this node is pushed to the result
    if (found > 0) {
      result.push(node);

      // If the actual node is virtual and is the closing tag, substract
      // one coincidence
      if (node.nodeType == 8) {
        const closingTag = '/' + upperCaseValue;
        if (nodeValue == closingTag) {
          found--;
        }
      }
    }
  }

  // Return the found nodes
  return {
    nodes: result,
  };
}

/**
 * Generates the content binding accessor wich uses sizzle to select
 * the nodes to show from the componentTemplateNodes. This accesor is then
 * applied to the template binding
 * @param {function} valueAccessor Value accesor of the content binding
 * @param {function} allBindingsAccessor Accesor for all bindings on the element
 * @param {BindingContext} context Binding context
 * @return {function} Accesor for the content binding
 */
function createContentAccesor(valueAccessor, allBindingsAccessor, context) {
  // Gets the value of the content binding
  const value = ko.unwrap(valueAccessor());
  // Check if the virtual binding is specified
  const virtual = allBindingsAccessor.get('virtual') || false;

  // Create the new accesor
  const newAccesor = function() {
    // If the virtual binding is specified we must use the content between
    // virtual tags with the specified name
    // <!-- example -->This<!-- /example -->
    if (virtual) {
      return getContentAccesorForVirtualNode(context, value);
    } else {
      // If a value is specified use it as a sizzle filter, if not use
      // all the nodes.
      if (is.defined(value)) {
        const nodes = $(context.$componentTemplateNodes).filter(value);
        return {
          nodes: nodes,
        };
      } else {
        return {
          nodes: context.$componentTemplateNodes,
        };
      }
    }
  };

  // Returns the new accesor
  return newAccesor;
}

/**
 * Creates the context for the content binding. It binds at parent level
 * and adds a property with the viewmodel of the contained component.
 * @param {BindingContext} context Binding context
 * @return {BindingContext} New binding context
 */
function createContentContext(context) {
  const parentContext = context.$parentContext;
  const viewModel = context.$data;

  const newContext = parentContext.extend({
    $containerContext: context,
    $container: viewModel.model,
  });

  return newContext;
}

/**
 * This binding is used in the template of a component to show the custom
 * markup passed to the component as content.
 * It allows to define where the specified content is shown in your
 * component's template.
 * You can specify a sizzle selector indicating wich part of the component
 * content to show, if no selector is specified all content is shown.
 * If the virtual binding is specified after this one, then all the content
 * between virtual tags is shown. For example, using the binding as
 * .. data-bind="content: 'example', virtual".. then the user must specify
 * the content as:
 * <!-- example -->This<!-- /example -->
 */
ko.bindingHandlers.content = {
  init: function(element, valueAccessor, allBindingsAccessor,
      viewModel, context) {
    const newAccesor = createContentAccesor(valueAccessor,
        allBindingsAccessor, context);
    const newContext = createContentContext(context);

    return ko.bindingHandlers.template.init(element, newAccesor,
        allBindingsAccessor, context.$parent, newContext);
  },
  update: function(element, valueAccessor, allBindingsAccessor,
      viewModel, context) {
    const newAccesor = createContentAccesor(valueAccessor,
        allBindingsAccessor, context);
    const newContext = createContentContext(context);

    return ko.bindingHandlers.template.update(element, newAccesor,
        allBindingsAccessor, context.$parent, newContext);
  },
};
ko.virtualElements.allowedBindings.content = true;

/**
 * Find if theres a element with the specified virtual tag
 * @param {BindingContext} context Original binding context
 * @param {any} value Value of the binding (name of the virtual tag)
 * @return {boolean} True if there's a virtual tag with the specified name.
 */
function findVirtualTag(context, value) {
  // Iterate over all nodes
  for (let i = 0; i < context.$componentTemplateNodes.length; i++) {
    const node = context.$componentTemplateNodes[i];
    const nodeValue = node.nodeValue.trim().toUpperCase();
    const upperCaseValue = value.toUpperCase();

    // If an opening node with the specified name is found return true
    if (node.nodeType == 8) {
      if (nodeValue == upperCaseValue) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Creates an accesor that returns true if there are elements that matches
 * the specified sizzle selector inside the component's content, or if virtual
 * node are used, try to find a virtual node with the specified name
 * @param {function} valueAccessor Accesor for the binding value
 * @param {function} allBindings Other bindings specified
 * @param {BindingContext} context Binding context
 * @return {function} Binding accesor for the hasContent bindings
 */
function createHasContentAccesor(valueAccessor, allBindings, context) {
  // Gets the value of the content binding
  const value = ko.unwrap(valueAccessor());
  // Check if the virtual binding is specified
  const virtual = allBindings.get('virtual') || false;

  // Creates the new accessor
  const newAccesor = function() {
    // If virtual node is used
    if (virtual) {
      return findVirtualTag(context, value);
    } else {
      // Check if the filter has any value
      return $(context.$componentTemplateNodes).filter(value).length > 0;
    }
  };

  return newAccesor;
}

/**
 * Shows and bind its content only if there are elements that
 * matches the specified sizzle selector in the component's content
 */
ko.bindingHandlers.hasContent = {
  init: function(element, valueAccessor, allBindingsAccessor,
      viewModel, context) {
    const newAccesor = createHasContentAccesor(valueAccessor,
        allBindingsAccessor, context);

    return ko.bindingHandlers['if'].init(element, newAccesor,
        allBindingsAccessor, context, context);
  },
};
ko.virtualElements.allowedBindings.hasContent = true;

/**
 * The inverse of the hasContent binding.
 */
ko.bindingHandlers.hasNotContent = {
  init: function(element, valueAccessor, allBindingsAccessor,
      viewModel, context) {
    const newAccesor = createHasContentAccesor(valueAccessor,
        allBindingsAccessor, context);

    return ko.bindingHandlers['ifnot'].init(element, newAccesor,
        allBindingsAccessor, context, context);
  },
};
ko.virtualElements.allowedBindings.hasNotContent = true;
