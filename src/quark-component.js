import ko from 'knockout';
import is from './is';

/**
 * Registers the quark component in Knockout, it contains the component scope
 * and model binder
 */
ko.components.register('quark-component', {
  template: `<!-- ko componentScope --><!-- /ko -->
             <!-- ko modelBinder --><!-- /ko -->`,
});

/**
 * The component scope creates the context for the component and bind its
 * template to its $scope variable effectively separating the properties and
 * methods needed for the view of those that are part of the model.
 * The binding also overrides the context, hiding the references to the
 * quark-component object.
 * Basically the binding is an extension of the template binding with an
 * altered context
 */
ko.bindingHandlers.componentScope = {
  init: function(element, valueAccessor, allBindingsAccessor,
      viewModel, context) {
    const newAccesor = createComponentScopeAccesor(context);
    const newContext = createComponentScopeContext(context);

    return ko.bindingHandlers.template.init(element, newAccesor,
        allBindingsAccessor, newContext.$data, newContext);
  },
  update: function(element, valueAccessor, allBindingsAccessor,
      viewModel, context) {
    const newAccesor = createComponentScopeAccesor(context);
    const newContext = createComponentScopeContext(context);

    return ko.bindingHandlers.template.update(element, newAccesor,
        allBindingsAccessor, newContext.$data, newContext);
  },
};
ko.virtualElements.allowedBindings.componentScope = true;

/**
 * Creates the component scope accesor with the DOM nodes of the component
 * It allows to use the quark components tag interior nodes and bind them
 * using the modified context the componentScope binding provides.
 * @param {BindingContext} context Original binding context for the
 * quark component
 * @return {BindingAccessors} Accesor for the component scope binding
 */
function createComponentScopeAccesor(context) {
  const newAccesor = function() {
    return {
      nodes: context.$componentTemplateNodes,
    };
  };

  return newAccesor;
};

/**
 * Alters the binding context for the component scope.
 * The component must bind at the parent level using it's scope as binding data,
 * but all other reference must be to the component's model.
 * @param {BindingContext} context Original binding context for the quark
 * component
 * @return {BindingContext} Modified binding context for the componentScope
 * binding
 */
function createComponentScopeContext(context) {
  // The model and context is at parent level
  const component = context.$parent;
  const parentContext = context.$parentContext;

  // Extend the current context and overwrite properties
  const newContext = context.extend({
    $component: component.getModel(),
    $componentTemplateNodes: parentContext.$componentTemplateNodes,
    $data: component.getScope(),
    $parent: parentContext.$parent ? parentContext.$parent.model : undefined,
    $parentContext: parentContext.$parentContext,
    $parents: parentContext.$parents,
    $rawData: component.getScope(),
    $root: parentContext.$root,
  });

  // If the parent array is defined and contains a valid quark-component parent
  if (is.array(newContext.$parents) && newContext.$parents[0]
      && newContext.$parents[0].model) {
    // Replace the reference to the quark-component with it's model only to
    // avoid exposing the scope and imports object
    newContext.$parents[0] = newContext.$parents[0].model;
  }

  return newContext;
}

/**
 * Quark allows to specify the model-bind attribute in the component's
 * custom tag. The binding defined in this way are executed in an special
 * context that is at the component's parent level but contains two new
 * properties $child and $childContext that allows to access the component
 * viewmodel and context.
 * The modelBinder searchs for the model-bind attribute and creates a virtual
 * element inside the quark-component modelBind tag that applies the specified
 * bindings when the element loads
 */
ko.bindingHandlers.modelBinder = {
  init: function(element, valueAccessor, allBindingsAccessor, viewModel,
      context) {
    // Get the new accessor and context for the binding
    const newAccesor = createModelBinderAccessor(element);
    const newContext = createModelBinderContext(context);

    // Basically the model binder is an extension of the template component
    return ko.bindingHandlers.template.init(element, newAccesor,
        allBindingsAccessor, context.$parent, newContext);
  },
  update: function(element, valueAccessor, allBindingsAccessor, viewModel,
      context) {
    // Get the new accessor and context for the binding
    const newAccesor = createModelBinderAccessor(element);
    const newContext = createModelBinderContext(context);

    // Basically the model binder is an extension of the template component
    return ko.bindingHandlers.template.update(element, newAccesor,
        allBindingsAccessor, context.$parent, newContext);
  },
};
ko.virtualElements.allowedBindings.modelBinder = true;

/**
 * Returns if the specified element is child of the "search" element,
 * taking into account even virtual elements.
 * @param {Node} element Element to check if is a child
 * @param {Node} search Element to check if is a parent
 * @return {boolean} True if the element is child of the search element.
 */
function isChildOf(element, search) {
  // Get the element's childs
  const childs = ko.virtualElements.childNodes(element);

  // If the specified element is in the element childs list return true
  for (let i = 0; i < childs.length; i++) {
    if (childs[i] == search) {
      return true;
    }
  }

  // If not found return false.
  return false;
}

/**
 * Returns the parent of the specified element, taking into account even
 * virtual elements.
 * @param {Node} element Element from which to found the parent
 * @return {Node} Parent element of the specified node
 */
function findParent(element) {
  // Get the previous sibling element (being a tag, text or comment)
  let previous = element.previousSibling;

  // It iterates over previous siblings of the given element trying to
  // find wich one has this element as child, if found, this is the parent
  // element.
  while (previous != null) {
    if (isChildOf(previous, element)) {
      return previous;
    }

    previous = previous.previousSibling;
  }

  // If there are no previous siblings, the parent is effectively the
  // real parent tag of the element (non virtual)
  if (previous == null) {
    return element.parentNode;
  }
}

/**
 * Return the value of the model-binder attribute from the specified virtual
 * node
 * @param {Node} element Element to check for the model binder attribute
 * @return {string} Value of the model-binder attribute, false if its not found
 */
function findModelBindAttributeInVirtualNode(element) {
  // If node is virtual find the model-bind="<binding>" string
  const match = element.nodeValue.match(/model-bind[\s]*:[\s]*\"[\s\S]*?\"/);

  // If a match is found create the binding in the model space
  if (match) {
    const content = match[0].match(/\"[\s\S]*?\"/);

    if (content) {
      const start = content[0].indexOf('\"') + 1;
      const end = content[0].indexOf('\"', start);

      return content[0].substring(start, end);
    }
  }

  return false;
}

/**
 * Return the value of the model-binder attribute from the specified node
 * @param {Node} element Element to check for the model binder attribute
 * @return {string} Value of the model-binder attribute, false if its not found
 */
function findModelBindAttributeInNode(element) {
  // If node is a normal tag, check if it has attributes
  if (element.attributes) {
    // Then search along the element's attributes and trying to
    // find the "model-bind" attribute.
    for (let i = 0; i < element.attributes.length; i++) {
      const attrib = element.attributes[i];

      // If found create the binding in the model space
      if (attrib.specified) {
        if (attrib.name == 'model-bind') {
          return attrib.value;
        }
      }
    }
  }

  return false;
}

/**
 * Return the value of the model-binder attribute from the specified element
 * even if its a virtual node.
 * @param {Node} element Element to check for the model binder attribute
 * @return {string} Value of the model-binder attribute
 */
function findModelBindAttribute(element) {
  if (element.nodeType == 8) {
    return findModelBindAttributeInVirtualNode(element);
  } else {
    return findModelBindAttributeInNode(element);
  }
}

/**
 * The modelBinder accessor searchs on the element's tag for the model-bind
 * attribute and creates a knockout binding inside the element that will be
 * bound when the element content loads.
 * @param {node} element Element in where the model-bind attribute is specified
 * @return {BindingAccessors} Accesor for the modelBinder
 */
function createModelBinderAccessor(element) {
  const newAccesor = function() {
    const nodes = [];

    // Find the element's defining tag. It's the grandparent because the
    // parent is the quark-object tag.
    let parent = findParent(element);
    parent = findParent(parent);

    const modelBind = findModelBindAttribute(parent);

    if (modelBind) {
      nodes.push(document.createComment(' ko ' + modelBind + ' '));
      nodes.push(document.createComment(' /ko '));
    }

    // Add the bindings to the template
    return {
      nodes: nodes,
      if: nodes.length > 0,
    };
  };

  // Return the new accessor
  return newAccesor;
}

/**
 * The model binder operates at the component parent's level.
 * To bind at this level it has to use the grand parent's context because
 * the parent is the quark-component.
 * It also extends this context with a property named $container wich contains
 * the component's model.
 * @param {BindingContext} context The original context of the component
 * @return {BindingContext} The new context for the modelBinder
 */
function createModelBinderContext(context) {
  const seniorContext = context.$parentContext.$parentContext;
  const viewModel = context.$parent;

  const newContext = seniorContext.extend({
    $child: viewModel.getModel(),
    $childContext: context.$parentContext,
  });

  return newContext;
}
