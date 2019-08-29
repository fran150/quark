import utils from './utils';
import Signals from 'signals';
import SyncLock from './lock';

/**
 * Allows to track the state of the dependencies of a component
 * or controller
 */
function Tracker() {
  const self = this;

  let mainModel;

  // Tracked dependencies
  const dependencies = {};

  // Reference to this tracker's parent and the name on the parent
  let parent;
  let nameOnParent;

  /**
   * Data for each dependency
   * @param {string} name Name of the dependency
   */
  function DependencyData(name) {
    this.name = name;
    this.loaded = false;
    this.ready = false;
    this.model = undefined;
    this.tracker = undefined;
  }

  // Lock to be released when the tracker readies
  this.ready = new SyncLock();
  // Signal fired when a dependency loads
  this.loaded = new Signals();
  // Signal fired when a dependency is ready
  this.readied = new Signals();

  /**
   * Return if this tracker is ready
   * @return {boolean} True if all dependencies on this tracker have loaded
   * and are ready.
   */
  this.isReady = function() {
    return !self.ready.isLocked();
  };

  /**
   * Adds a dependency with the specified name to this tracker
   * @param {string} name Name of the dependency to add
   */
  this.addDependency = function(name) {
    // Lock the ready property
    self.ready.lock();

    // Start tracking the dependency state by adding it to the list
    dependencies[name] = new DependencyData(name);
  };

  // Delete the dependency with the specified name
  this.removeDependency = function(name) {
    // If the dependency exists..
    if (dependencies[name]) {
      // Get the dependency's tracker
      const tracker = dependencies[name].tracker;

      // If it has a tracker delete the parent reference
      if (tracker) {
        utils.undefine(tracker.parent);
      }

      // Delete the dependency from this tracker
      delete dependencies[name];
    }
  };

  /**
   * Load a dependency into the tracker
   * @param {string} name Name of the dependency to load
   * @param {any} model Dependency model
   * @param {Tracker} tracker Dependency tracker if it has one associated
   */
  this.loadDependency = function(name, model, tracker) {
    // Save the model and mark the dependency as loaded
    dependencies[name].model = model;
    dependencies[name].tracker = tracker;
    dependencies[name].loaded = true;

    // Signal the load of this dependency
    self.loaded.dispatch(name, model);

    // If the dependency is tracking itself..
    if (tracker) {
      // Set the dependency parent data
      tracker._setParent(self, name);

      // Check the dependency state and set it on this tracker
      if (tracker.isReady()) {
        self.readyDependency(name);
      } else {
        dependencies[name].ready = false;
      }
    } else {
      // If the dependency has no tracker mark it as ready on
      // this tracker
      self.readyDependency(name);
    }
  };

  /**
   * Used to indicate that a dependency child dependency is ready
   * @param {string} name Name of the dependency that is ready
   */
  this.readyDependency = function(name) {
    // Mark the dependency as ready
    dependencies[name].ready = true;

    // Signal the dependency readiness
    self.readied.dispatch(name, dependencies[name].model);

    // Check this tracker readiness and if its ready mark it and inform
    // the parent
    if (checkReady()) {
      self.ready.unlock();

      // If this tracker has a parent, invoke the readyDependency method
      // on the parent to signal the readiness
      if (parent) {
        parent.readyDependency(nameOnParent, mainModel, self);
      }
    }
  },

  /**
   * Sets the main model of this tracker
   * @param {any} model The main object associated with this tracker
   */
  this.setMainModel = function(model) {
    mainModel = model;
  },

  /**
   * Sets this tracker parent and the name of this tracker among the parent
   * dependencies
   * @param {Tracker} parentTracker Parent tracker of this tracker
   * @param {string} name Name of this tracker among the parent dependencies
   */
  this._setParent = function(parentTracker, name) {
    parent = parentTracker;
    nameOnParent = name;
  };

  /**
   * Returns the model associated with the dependency of the specified name
   * @param {string} name Name of the dependency
   * @return {object} Object associated to the specifed dependency name
   */
  this.get = function(name) {
    // Get the dependency with the specified name
    const dependency = dependencies[name];

    // If there's a dependency defined return the model
    if (dependency) {
      return dependency.model;
    }
  };

  /**
   * Clear all the specified dependencies
   */
  this.reset = function() {
    self.ready.lock();

    // Iterate over all dependencies deleting each one
    utils.each(dependencies, function(name) {
      self.removeDependency(name);
    });
  };

  /**
   * Dispose this tracker removing all dependencies
   */
  this.dispose = function() {
    self.ready.dispose();
    self.loaded.removeAll();
    self.readied.removeAll();

    self.reset();
  };

  /**
   * Check if all dependencies are ready and we should open the lock
   * @return {boolean} True if all the dependencies have been loaded
   */
  function checkReady() {
    // Iteate over all dependencies, and if one dependency is not loaded
    // or ready return false
    utils.each(dependencies, function(name) {
      const state = dependencies[name];
      if (!state.loaded || !state.ready) {
        return false;
      }
    });

    // Otherwise all dependencies are ready and this tracker is ready
    return true;
  }
};

export default Tracker;
