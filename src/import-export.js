import ko from 'knockout';
import is from './is';

/**
 * Add the model binding to the specified virtual node
 * @param {Node} element Virtual node in where to add the model-bind attribute
 * @param {string} name Name of the binding
 * @param {string} bindTarget Name of the binding target
 */
function addModelBindingInVirtualNode() {
  // Search for the model-bind attribute in the virtual tag
  const match = element.nodeValue.match(/model-bind[\s]*:[\s]*\"[\s\S]*?\"/);

  // If a match is found
  if (match) {
    // Get the content of the binding
    const content = match[0].match(/\"[\s\S]*?\"/);

    // If content is found add the specified binding to the existing
    if (content) {
      const start = content[0].indexOf('\"') + 1;
      const end = content[0].indexOf('\"', start);

      const value = content[0].substring(start, end);

      let newContent = '\"' + value;

      if (value) {
        newContent += ', ';
      }

      newContent += bindTarget + ': \'' + name + '\'"';
      element.nodeValue = element.nodeValue.replace(content[0], newContent);
    }
  } else {
    // If the model-bind attribute is not found create it with the specified
    // binding
    element.nodeValue += 'model-bind: "' + bindTarget + ': \'' + name + '\'"';
  }
}

/**
 * Add the model binding to the specified node
 * @param {Node} element node in where to add the model-bind attribute
 * @param {string} name Name of the binding
 * @param {string} bindTarget Name of the binding target
 */
function addModelBindingInNode(element, name, bindTarget) {
  let found = false;

  // If node is a normal tag, check if it has attributes
  if (element.attributes) {
    // Then search along the element's attributes and trying to find the
    // "model-bind" attribute.
    for (let i = 0; i < element.attributes.length; i++) {
      const attrib = element.attributes[i];

      // If found create the binding in the model space
      if (attrib.specified) {
        if (attrib.name == 'model-bind') {
          if (attrib.value) {
            attrib.value += ', ';
          }

          attrib.value += bindTarget + ': \'' + name + '\'';
          found = true;
        }
      }
    }
  }

  // If the model-bind tag is not found create it with the specified tag
  if (!found) {
    element.setAttribute('model-bind', bindTarget + ': \'' + name + '\'');
  }
}

/**
 * Add the model binding to the specified element
 * @param {Node} element Element in where to add the model-bind attribute
 * @param {string} name Name of the binding
 * @param {string} bindTarget Name of the binding target
 */
function addModelBinding(element, name, bindTarget) {
  // If the element is virtual
  if (element.nodeType == 8) {
    addModelBindingInVirtualNode(element, name, bindTarget);
  } else {
    addModelBindingInNode(element, name, bindTarget);
  }
}

/**
 * Allows to import the component viewmodel to it's parent.
 * The binding starts tracking the new dependency in the parent component and
 * adds a model-bind attribute to the components tag that uses
 * the export binding to actually load the component model to the parent's
 * dependency tracker.
 */
ko.bindingHandlers.import = {
  init: function(element, valueAccessor, allBindings, viewModel, context) {
    // Gets the name of the property in which to import the viewmodel
    const name = valueAccessor();

    let imports;

    // If the target object has to have a tracker attached. So we check
    // if the import property exists and if it's of type Tracker.
    if (viewModel && viewModel.imports
        && viewModel.imports instanceof Tracker) {
      imports = viewModel.imports;
    } else {
      throw new Error('The import binding can only import the model to '
          + 'objects with a dependency tracker attached');
    }

    // Start tracking this dependency
    imports.addDependency(name);

    // Adds the export binding to the element
    addModelBinding(element, name, 'export');
  },
};
ko.virtualElements.allowedBindings.import = true;

/**
 * The export binding is designed to run on the model-bind attribute
 * It uses the $childContext property in the modelBinder context to
 * extract the child component model and tracker and loaded in the
 * parent's depdendency tracker.
 */
ko.bindingHandlers.export = {
  init: function(element, valueAccessor, allBindings, viewModel, context) {
    // Get's the binded value
    const value = ko.unwrap(valueAccessor());

    let imports;

    // If the target object has to have a tracker attached. So we check
    // if the import property exists and if it's of type Tracker.
    if (viewModel && viewModel.imports
        && viewModel.imports instanceof Tracker) {
      imports = viewModel.imports;
    } else {
      throw new Error('The import binding can only import the model to '
          + 'objects with a dependency tracker attached');
    }

    let property;

    if (is.string(value)) {
      property = value;
    } else {
      throw new Error('The value of the binding must be an string'
          + ' with the name of the created dependency in the tracker in where'
          + ' quark will load the exported model');
    }

    if (imports) {
      const childScope = context.$childContext.$data;
      const childModel = childScope.getModel();
      const childTracker = childScope.getImports();

      imports.loadDependency(property, childModel, childTracker);
    }
  },
};
ko.virtualElements.allowedBindings.export = true;

/**
 * Outlet binding, allows to show the configured component for the actual route
 */
ko.bindingHandlers.outlet = {
  init: function(element, valueAccessor, allBindingsAccessor,
      viewModel, context) {
    // Get outlet name
    const value = ko.unwrap(valueAccessor());
    // Current controller name
    let currentController;
    // Component name to show on this outlet
    const componentData = ko.observable({
      name: 'empty',
    });

    const resetScroll = allBindingsAccessor.get('resetScroll') || true;

    /**
     * Subscription function that updates the component when the component
     * to be shown changes due to routing
     * @param {string} newValue New component to show
     */
    function updateValue(newValue) {
      // Route names
      let names = [];

      // If a new route value is specified
      if (newValue) {
        names = newValue.split('/');
      }

      let controller;
      let fullName;

      let newComponentName;
      let newController;
      let newTracker;

      // For each part in the new route
      for (let i = 0; i < names.length; i++) {
        // Get the name a full name at the given position
        const name = names[i];
        fullName = fullName ? fullName + '/' + name : name;

        // Get the controller at this position
        controller = current.controllers[fullName];
        const tracker = current.trackers[fullName];

        // Iterate the outlets defined in the controller
        utils.each(controller.outlets, function(outletName) {
          // If the outlet name corresponds to the configured
          if (outletName == value) {
            // Set the new component name and controller
            newComponentName = controller.outlets[outletName];
            newController = controller;
            newTracker = tracker;
          }
        });
      }

      // If there is a new component defined
      if (newComponentName) {
        // If the new component name and controller differs from previous
        if (newComponentName != componentData().name ||
            newController != currentController) {
          // Init the binding data with the component name
          const data = {
            name: newComponentName,
          };

          // If the new controller has a sendParameters method call it to
          // obtain component's parameters and add them to the binding data
          if (newController && newController.sendParameters) {
            data.params = newController.sendParameters(value, newComponentName);
          } else {
            data.params = {};
          }

          newTracker.addDependency(value);

          // Save the current controller and bind the new value
          currentController = newController;
          componentData(data);

          if (resetScroll) {
            window.scrollTo(0, 0);
          }
        }
      } else {
        // if there isn't a new component clear controller and
        // bind to the empty template
        currentController = '';
        componentData({
          name: 'empty',
        });
      }
    }

    // Subscribe to name changes (routing)
    const subscription = current.name.subscribe(updateValue);

    updateValue(current.name());

    // Destroy subscription on element disposal
    ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
      subscription.dispose();
      currentController = '';
    });

    // Add model binding to export to controller
    addModelBinding(element, value, 'exportToController');

    const newAccessor = function() {
      return componentData;
    };

    return ko.bindingHandlers.component.init(element, newAccessor,
        allBindingsAccessor, viewModel, context);
  },
};
ko.virtualElements.allowedBindings.outlet = true;

/**
 * Similar to the regular export binding but in this case allows to
 * export outlet models to the controller's tracker
 */
ko.bindingHandlers.exportToController = {
  init: function(element, valueAccessor, allBindings, viewModel, context) {
    // Get dependency name
    const value = ko.unwrap(valueAccessor());

    // Route names
    let names = [];

    const currentName = current.name();

    // If a new route value is specified
    if (currentName) {
      names = currentName.split('/');
    }

    let controller;
    let fullName;

    let actualController;
    let actualTracker;

    // For each part in the new route
    for (let i = 0; i < names.length; i++) {
      // Get the name a full name at the given position
      const name = names[i];
      fullName = fullName ? fullName + '/' + name : name;

      // Get the controller at this position
      controller = current.controllers[fullName];
      const tracker = current.trackers[fullName];

      // Iterate the outlets defined in the controller
      utils.each(controller.outlets, function(outletName) {
        // If the outlet name corresponds to the configured
        if (outletName == value) {
          actualController = controller;
          actualTracker = tracker;
        }
      });
    }

    if (actualController && actualTracker) {
      const childModel = context.$childContext.$data.getModel();
      const childTracker = context.$childContext.$data.getImports();

      actualTracker.loadDependency(value, childModel, childTracker);
    }

    actualController = '';
    actualTracker = '';
  },
};
ko.virtualElements.allowedBindings.exportToController = true;
