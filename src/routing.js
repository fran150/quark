import ko from 'knockout';
import crossroads from 'crossroads';
import utils from './utils';
import Signal from 'signals';
/**
 * Main routing class for quark.
 * Define which components should be loaded on each outlet defined in the page
 * based on the parameters and route specified in the url after the # sign
 */
function QuarkRouter() {
  const self = this;

  // Create a new crossroads router
  const csRouter = crossroads.create();
  csRouter.normalizeFn = crossroads.NORM_AS_OBJECT;
  csRouter.ignoreState = true;

  // Current page data
  const current = {
    name: ko.observable(),
    module: ko.observable(),
    controllers: {},
    trackers: {},
  };

  // Current route name observable
  this.current = current.name;
  this.currentModule = current.module;
  this.currentHash = ko.observable();

  // Routed signal
  this.routed = new Signal();

  // Defined pages, mappings, crossroads routes and parameters
  const pages = {};
  const mappings = {};
  const routes = {};
  const params = {};

  // Used to store the module in wich the page was defined
  const pagesModule = {};

  /**
   * Adds the specified page and params config to quark's routing system
   * @param {any} pagesConfig Page configuration specifying the component
   * to load on each outlet
   * @param {any} paramsConfig Parameters configuration specifying the
   * available parameters for each page if any
   */
  this.pages = function(pagesConfig, paramsConfig) {
    // Combine current configuration with the new
    utils.merge(pages, pagesConfig);

    // If a parameter configuration is specified combine it with the
    // previous
    if (paramsConfig) {
      utils.merge(params, paramsConfig);

      for (const pageName in paramsConfig) {
        if (!is.defined(pages[pageName])) {
          pages[pageName] = {};
        }
      }
    }
  };

  /**
   * Configuration for the specified page
   * @param {string} pageName Name of the page
   */
  function PageConfiguration(pageName) {
    this.name = pageName;
    this.outlets = {};
    this.route = {};
    this.param = {};
    this.module = {};

    if (pages[pageName]) {
      this.name = pageName;
      this.outlets = pages[pageName];
    }

    if (mappings[pageName]) {
      this.route = mappings[pageName];
    }

    if (params[pageName]) {
      this.param = params[pageName];
    }

    if (pagesModule[pageName]) {
      this.module = pagesModule[pageName];
    }
  };

  /**
   * Returns the routing configuration of the specified page
   * @param {string} pageName Name of the page from which to obtain the
   * configuration
   * @return {PageConfiguration} Page configuration
   */
  this.getPageConfig = function(pageName) {
    return new PageConfiguration(pageName);
  };

  /**
   * Default controller provider.
   * It maintains a list of controller classes, when the routing system
   * needs to load a controller it calls the load function of this
   * class passing the page as parameter.
   * You can change the default controller provider by changing this
   * class for your own. The only method you need to implement is the
   * load function.
   */
  function ControllerProvider() {
    const controllers = {};

    /**
     * Registers the controller for the specified page
     * @param {string} page Name of the page
     * @param {any} ControllerClass Class of the controller to create for
     * the specified page
     */
    this.registerController = function(page, ControllerClass) {
      controllers[page] = ControllerClass;
    };

    /**
     * Loads the controller for the specified page.
     * This function should call the success callback when it has loaded
     * the controller class for the specified page. If an error ocurrs
     * during load it should call the error callback passing the error.
     * @param {string} page Name of the page
     * @param {function} successCallback Callback to call passing the
     * controller class when its loaded
     * @param {function} errorCallback Callback to call passing the error
     * if an error occurs during the controller load
     */
    this.load = function(page, successCallback, errorCallback) {
      if (is.defined(controllers[page])) {
        successCallback(controllers[page]);
      } else {
        errorCallback();
      }
    };
  };

  this.controllerProvider = new ControllerProvider();

  /**
   * Position of a subpage in a page name string
   * @param {integer} index Index of the page subpath
   * @param {string} fullName Full name of the subpath
   * @param {boolean} notFound True if the subpage was not found
   */
  function PagePosition(index, fullName, notFound) {
    this.index = index;
    this.fullName = fullName;
    this.notFound = notFound;
  }

  /**
   * Gets the index and full path name of the shared parts
   * between the old and the new page
   * @param {string} newPage New page to set as current
   * @return {any} Object with the position and the name of the shared
   * path between the current and new page.
   */
  function findPosition(newPage) {
    // Get the current page name
    const currentName = current.name();

    // If theres a current page, split its components
    // If not return the first position
    let oldNames;
    if (currentName) {
      oldNames = currentName.split('/');
    } else {
      return new PagePosition(0, undefined, true);
    }

    // Split the new name parts
    const newNames = newPage.split('/');
    let fullName;

    // Compare each route and return the position where
    // they diverge
    for (let i = 0; i < newNames.length; i++) {
      if (oldNames[i] != newNames[i]) {
        return new PagePosition(i, fullName, false);
      } else {
        fullName = fullName ? fullName + '/' + oldNames[i] : oldNames[i];
      }
    }

    // The page is the same, return the last index and the full name
    return new PagePosition(newNames.length, fullName, false);
  };

  /**
   * Default controller class
   */
  function DefaultController() {
  }

  /**
   * Configs a newly created controller
   * @param {string} fullName Controller full name to use on the tracker
   * @param {any} controller Controller model
   * @param {Tracker} tracker Tracker for the controller
   * @param {any} parentController Parent controller
   */
  function configControllerAndTracker(fullName, controller, tracker,
      parentController) {
    // Sets the tracker main model to the controller and force open the lock
    tracker.setMainModel(controller);
    tracker.ready.force();

    // Set the trackers and controllers of the current page
    current.trackers[fullName] = tracker;
    current.controllers[fullName] = controller;

    // If the previous controller is defined
    if (parentController) {
      // Add a property to the current controller pointing to the parent
      controller.parent = parentController;
    }
  };

  /**
   * Loads controllers given the new page, position where the previous
   * and new page differ and call the callback when ready
   * @param {String} page New page to load
   * @param {PagePosition} position Position where the new and old pages differ.
   * @param {function} callback Function to callback once the controller
   * is loaded
   */
  function addControllers(page, position, callback) {
    // Page names array
    let names = [];

    // If page is specified, divide it in its parts
    if (page) {
      names = page.split('/');
    }

    // If the differing position is before the end of the names array
    if (position.index < names.length) {
      // Get the name at the current position
      const name = names[position.index];
      // Save the previous fullname
      const previousName = position.fullName;

      // Get parent controller
      let parentController;

      if (previousName && current.controllers[previousName]) {
        parentController = current.controllers[previousName];
      }

      // Get the new full name combining the full name and this position's name
      const fullName = position.fullName ? position.fullName + '/'
          + name : name;

      // Calculate new position
      const newPosition = new PagePosition(position.index + 1, fullName);

      // Load with Require the controller
      self.controllerProvider.load(fullName, function(ControllerClass) {
        // If a controller class is found and loaded create the object
        const tracker = new Tracker();
        const newController = new ControllerClass(parentController, tracker);

        // Config the new controller and tracker
        configControllerAndTracker(fullName, newController, tracker,
            parentController);

        // Recursively add the next controller
        addControllers(page, newPosition, callback);
      }, function() {
        // If a controller class is not found create the default controller
        const tracker = new Tracker();
        const newController = new DefaultController(parentController, tracker);

        // Config the new controller and tracker
        configControllerAndTracker(fullName, newController, tracker,
            parentController);

        // Recursively add the next controller
        addControllers(page, newPosition, callback);
      });
    } else {
      // If differing position is at the end of the array we are done
      // routing
      callback();
    }
  }

  /**
   * Clears the old controllers passing the given position
   * @param {PagePosition} position Clears all the controllers
   * passing this position
   */
  function clearControllers(position) {
    // Get the current page name
    const currentName = current.name();

    // If theres a current page, split its components, if not
    // init an empty array
    let names = [];
    if (currentName) {
      names = currentName.split('/');
    }

    // Get the position full name
    let fullName = position.fullName;

    // Iterate over all name parts starting in the specified position
    for (let i = position.index; i < names.length; i++) {
      // Get the name and fullName
      const name = names[i];
      fullName = fullName ? fullName + '/' + name : name;

      // Get current controller
      const controller = current.controllers[fullName];
      const tracker = current.trackers[fullName];

      // If the controller has a dispose method call it allowing code
      // clean up
      if (controller) {
        if (is.function(controller.dispose)) {
          controller.dispose();
        }
      }

      if (tracker) {
        tracker.dispose();
      }

      // Delete the controller reference
      delete current.controllers[fullName];
      delete current.trackers[fullName];
    }
  }

  /**
   * Clears the outlets defined in the current routes
   * passing the specified position
   * @param {PagePosition} position Position from where to clear all the
   * defined outlet
   */
  function clearOutlets(position) {
    // Get the current page name
    const currentName = current.name();

    // Page name parts
    let names = [];

    // If theres a current page, split its components
    if (currentName) {
      names = currentName.split('/');
    }

    // Get the first position full name
    let fullName = position.fullName;

    // Iterate over all name parts starting in the specified position
    for (let i = position.index; i < names.length; i++) {
      // Get the name and fullName of the next position
      const name = names[i];
      fullName = fullName ? fullName + '/' + name : name;

      // Get the part components and current controller
      const components = pages[fullName];
      const controller = current.controllers[fullName];

      // Iterate over part components and set the empty template
      utils.each(components, function(item) {
        controller.outlets[item] = 'empty';
      });
    }
  };

  /**
   * Add all componentes defined in the page parts after the specified
   * position
   * @param {string} newPage New page being loaded
   * @param {PagePosition} position Position from where to start adding
   * components
   */
  function addOutlets(newPage, position) {
    // Page name parts
    let newNames = [];

    // If theres a new page defined split it's parts
    if (newPage) {
      newNames = newPage.split('/');
    }

    // Init the full name at the specified position
    let fullName = position.fullName;

    // Iterate over all name parts stating on the specified position
    for (let i = position.index; i < newNames.length; i++) {
      // Get the name and full name
      const name = newNames[i];
      fullName = fullName ? fullName + '/' + name : name;

      // Current controller at position
      const controller = current.controllers[fullName];

      // Get all components name for the current position index
      const componentsValues = pages[fullName];

      // If the outlets object is not created on the controller init an
      // empty object
      if (!controller.outlets) {
        controller.outlets = {};
      }

      // Iterate over all components and add the configured outlets
      // to current controller
      utils.each(componentsValues, function(item, value) {
        controller.outlets[item] = value;
      });

      // Get all the parameters configured for this page
      const parameters = params[fullName];

      // If the params object is not created on the controller init an
      // empty object
      if (!controller.params) {
        controller.params = {};
      }

      // If there are parameters defined for this route
      if (parameters) {
        if (is.array(parameters)) {
          // Iterate over all defined parameters and create an observable
          // in the controller's param object for each
          for (let j = 0; j < parameters.length; j++) {
            controller.params[parameters[j]] = ko.observable();
          }
        } else if (is.object(parameters)) {
          utils.each(parameters, function(paramName, paramValue) {
            controller.params[paramName] = ko.observable(paramValue);
          });
        } else {
          throw new Error('The parameters of \'' + fullName +
              '\' must be an object or array');
        }
      }
    }
  }

  /**
   * Sets the parameters values with the values specified in the route
   * @param {any} parameterValues The parameter values
   * @param {string} page Current page
   */
  function setParameters(parameterValues, page) {
    // Page parts and full name
    let names = [];
    let fullName;

    // If a page is defined split its parts
    if (page) {
      names = page.split('/');
    }

    // For each name in the route
    for (let i = 0; i < names.length; i++) {
      // Get the  name and full name at the current position
      const name = names[i];
      fullName = fullName ? fullName + '/' + name : name;

      // If there are parameters at the current position
      if (params[fullName]) {
        // Get the current controller
        const controller = current.controllers[fullName];

        // If the controller params object is created
        if (controller && controller.params) {
          // Iterate over each param name and set the parameter value
          for (const paramName in controller.params) {
            if (is.defined(parameterValues[paramName])) {
              const value = parameterValues[paramName];
              controller.params[paramName](value);
            }
          }
        }
      }
    }
  }

  /**
   * Calls init method on all new controllers
   * @param {string} newPage New page path
   * @param {PagePosition} position Position on the page where the new
   * page starts
   */
  function initControllers(newPage, position) {
    // Page name parts
    let newNames = [];

    // If theres a new page defined split it's parts
    if (newPage) {
      newNames = newPage.split('/');
    }

    // Init the full name at the specified position
    let fullName = position.fullName;

    // Iterate over all name parts stating on the specified position
    for (let i = position.index; i < newNames.length; i++) {
      // Get the name and full name
      const name = newNames[i];
      fullName = fullName ? fullName + '/' + name : name;

      // Current controller at position
      const controller = current.controllers[fullName];

      // If controller and init method are defined call it
      if (controller && controller.init) {
        controller.init();
      }
    }
  }

  /**
   * Creates a new crossroad route for each specified page map
   * @param {string} page Full path of the new page
   * @param {string} hash Current hash
   */
  function createRoute(page, hash) {
    // Create a route for the page and hash
    routes[page] = csRouter.addRoute(hash, function(parameters) {
      // Get's the shared position between the old and new page
      const position = findPosition(page);

      // Delete all components of the old page
      clearOutlets(position);
      // Clear the old controllers
      clearControllers(position);

      addControllers(page, position, function() {
        // Add the components of the new page
        addOutlets(page, position);

        // Set the new set of parameters
        setParameters(parameters, page);

        // Call init method on all new controllers
        initControllers(page, position);

        // Set the new page name and module
        current.name(page);

        // Dispatch the routed signal
        self.routed.dispatch(page);
      });
    });
  }

  /**
   * Configures the routes corresponding to each page
   * @param {any} maps Mapping between routes and the corresponding
   * hash to load it.
   */
  this.mapRoute = function(maps) {
    // For each page to be mapped
    utils.each(maps, function(page, hash) {
      // Create and configure a crossroad route for each route and page
      createRoute(page, hash);

      // Add the mapping between page and hash to the object
      mappings[page] = hash;
    });
  };

  /**
   * Parse the specified hash actually routing the application to
   * the corresponding page.
   * @param {string} hash New hash to parse
   */
  this.parse = function(hash) {
    // Sets the current Hash
    self.currentHash(hash);

    // Use the crossroad route to parse the hash
    csRouter.parse(hash);
  };

  /**
   * Gets the hash for the specified page and options
   * @param {string} page Name of the page from which to obtain the hash
   * @param {any} options An object where the name of each property
   * correspond to the parameters defined for the page and its value is
   * the value to assign to the parameter
   * @return {string} Hash to use to access the specified page
   */
  this.hash = function(page, options) {
    // Get the crossroad route of the specified page
    const route = routes[page];

    // If a route is found interpolate the hash
    if (route) {
      return route.interpolate(options);
    }
  };

  /**
   * Activate the crossroad hasher, you can define a custom function
   * to execute when the route changes (inside must call to the parse method
   * to actually perform the routing)
   * @param {function} callback Function to call to perform the routing
   */
  this.activateHasher = function(callback) {
    /**
     * Default routing function.
     * @param {string} newHash New hash being loaded
     * @param {string} oldHash Old hash being unloaded
     */
    function parseHash(newHash, oldHash) {
      if (is.defined(callback)) {
        callback(newHash, oldHash);
      } else {
        self.parse(newHash);
      }
    }

    hasher.initialized.add(parseHash);
    hasher.changed.add(parseHash);
    hasher.init();
  };
}

// Create the quark router
export default new QuarkRouter();
