function Tracker() {
    var self = this;

    var mainModel;

    // Tracked dependencies
    var dependencies = {};

    // Reference to this tracker's parent and the name on the parent
    var parent;
    var nameOnParent;

    // Stores dependency data
    function DependencyData(name) {
        this.name = name;
        this.loaded = false;
        this.ready = false;
        this.model = undefined;
        this.tracker = undefined;
    }

    // Lock to be released when the tracker readies
    this.ready = $$.lock();
    // Signal fired when a dependency loads
    this.loaded = $$.signal();
    // Signal fired when a dependency is ready
    this.readied = $$.signal();

    // Return if this tracker is ready
    this.isReady = function() {
        return !$$.isLocked(self.ready);
    }

    // Adds a dependency to this tracker
    this.addDependency = function(name) {
        // Lock the ready property
        self.ready.lock();

        // Start tracking the dependency state by adding it to the list
        dependencies[name] = new DependencyData(name);
    }

    // Delete the dependency with the specified name
    this.removeDependency = function(name) {
        // If the dependency exists..
        if (dependencies[name]) {
            // Get the dependency's tracker
            var tracker = dependencies[name].tracker;

            // If it has a tracker delete the parent reference
            if (tracker) {
                $$.undefine(tracker.parent);
            }

            // Delete the dependency from this tracker
            delete dependencies[name];
        }
    }

    // Used to indicate that a dependency has loaded
    this.loadDependency = function(name, model, tracker) {
        // Save the model and mark the dependency as loaded
        dependencies[name].model = model;
        dependencies[name].tracker = tracker;
        dependencies[name].loaded = true;

        // Signal the load of this dependency
        self.loaded.dispatch(name, model);

        // If the dependency is tracking itself..
        if (tracker) {
            // Check the dependency state and set it on this tracker
            if (tracker.isReady()) {
                self.readyDependency(name);
            } else {
                dependencies[name].ready = false;
            }

            // Set the dependency parent data
            tracker.setParent(self, name);
        } else {
            // If the dependency has no tracker mark it as ready on
            // this tracker
            self.readyDependency(name);
        }
    }

    // Used to indicate that a dependency is ready
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
    }

    // Set the main model of this tracker
    this.setMainModel = function(model) {
        mainModel = model;
    }

    // Sets this tracker parent and dependency name on the parent
    this.setParent = function(parentTracker, name) {
        parent = parentTracker;
        nameOnParent = name;
    }

    // Returns the dependency model with the specified name
    this.get = function(name) {
        // Get the dependency with the specified name
        var dependency = dependencies[name];

        // If there's a dependency defined return the model
        if (dependency) {
            return dependency.model;
        }
    }

    // Dispose this tracker removing all dependencies
    this.dispose = function() {
        self.ready.dispose();
        $$.signalClear(self.loaded);
        $$.signalClear(self.readied);

        // Iterate over all dependencies deleting each one
        for (var name in dependencies) {
            self.removeDependency(name);
        }
    }

    // Checks if this tracker is ready
    function checkReady() {
        // Iteate over all dependencies, and if one dependency is not loaded
        // or ready return false
        for (var name in dependencies) {
            var state = dependencies[name];
            if (!state.loaded || !state.ready) {
                return false;
            }
        }

        // Otherwise all dependencies are ready and this tracker is ready
        return true;
    }
}
