
    var self = this;

    // Loaded behaviours array
    this.behaviours = {};

    // Loads a behaviour with the specified name
    this.behaviour = function(name, behaviour) {
        // Warn if repeated
        if (self.behaviour[name]) {
            console.warn('There was already a behaviour loaded with the name ' + name + '. It will be replaced with the new one.');
        }

        // Error if behaviour name is not a string
        if (!self.isString(name)) {
            throw 'The behaviour name must be an string.';
        }

        // Error if behaviour is not a function
        if (!self.isFunction(behaviour)) {
            throw 'The behaviour must be a function that takes an object as a parameter an applies the new functionality to it.';
        }

        // Adds the new behaviour to the table
        self.behaviours[name] = behaviour;
    }

    // Applies a behaviour to the object
    function applyBehaviour(object, behaviourName) {
        // Error if behaviour name is not a string
        if (!self.isString(behaviourName)) {
            throw 'The behaviour name must be an string. If you specified an array check that all elements are valid behaviour names';
        }

        // Chek if behaviour exists
        if (self.behaviours[behaviourName]) {
            // Apply new behaviour
            self.behaviours[behaviourName](object);
        } else {
            throw 'The are no behaviours loaded with the name ' + behaviourName + '.';
        }
    }

    // Applies the behaviour to the object. You can specify a string with the name of a loaded behaviour
    // or an array of behaviour names.
    this.behave = function(object, behaviour) {
        // Validates object
        if (!self.isObject(object)) {
            throw 'You must specifify a valid object to apply the behaviour.';
        }

        if (self.isArray(behaviour)) {
            // If it's an array we iterate it applying each behaviour
            for (var i = 0; i < behaviour.length; i++) {
                applyBehaviour(object, behaviour[i]);
            }
        } else if (self.isString(behaviour)) {
            // If it's a string apply the named behaviour
            applyBehaviour(object, behaviour);
        } else {
            // Everything else fails
            throw 'The behaviour name must be an string or an array of strings.';
        }
    }

    // Receive configuration params extacting the value if neccesary.
    this.config = function(config, values, object) {
        // Checks the configuration object
        if (!self.isObject(config)) {
            throw 'You must specify a config object';
        }

        // Checks the values object
        if (!self.isObject(values)) {
            throw 'You must specify the configured values for the component, usually you can obtain it from the parameters array received in the component\'s constructor.';
        }

        if (!self.isDefined(object)) {
            throw 'You must specify the viewmodel of the component in wich to load the configuration.';
        }

        // Check object's config object and if not exists creates it.
        if (!self.isDefined(object['config'])) {
            object.config = {};
        }

        // Iterates configuration...
        for (var name in config) {
            // Warn if config exists
            if (!self.isDefined(object.config[name])) {
                console.warn('There is already a config property named ' + name + ' in the target component. The property will be replaced.');
            }

            // Sets the new config property with the default value to the target component
            object.config[name] = config[name];

            // Warn if property is defined as observable
            if (ko.isObservable(object.config[name])) {
                console.warn('Property ' + name + ' should not be observable. The configuration parameters should be static, if you want the object to react to parameter changes use the parameters method.');
            }

            // If there is a value for the configuration then replace it in the configuration property
            if (self.isDefined(values[name])) {
                // if the source value is an observable extract value if not use as is
                if (ko.isObservable(values[name])) {
                    object.config[name] = values[name]();
                } else {
                    object.config[name] = values[name];
                }
            }
        }
    }

    // Receive parameters from the component tag and set them into the viewmodel
    this.parameters = function(params, values, object) {
        // Checks the parameters configuration object
        if (!self.isObject(params)) {
            throw 'You must specify a parameters config object';
        }

        // Checks the values object
        if (!self.isObject(values)) {
            throw 'You must specify the configured values for the component, usually you can obtain it from the parameters array received in the component\'s constructor.';
        }

        if (!self.isDefined(object)) {
            throw 'You must specify the viewmodel of the component in wich to load the parameters.';
        }

        // Iterate the parameters
        for (var name in params) {
            // Warn if config exists
            if (!self.isDefined(object[name])) {
                console.warn('There is already a property named ' + name + ' in the target component. It will be replaced with the specified parameter.');
            }

            // Create an object property with the parameter
            object[name] = params[name];

            // If there is a value defined in the component tag for the parameter
            if (self.isDefined(values[name])) {
                // If both target and source params are observable try to overwrite it
                if (ko.isObservable(object[name]) && ko.isObservable(values[name])) {
                    // If target parameter is a computed do not overwrite it, the computed function MUST use the parameter
                    // directly (see ko.computedParameter)
                    if (!ko.isComputed(object[name])) {
                        object[name] = values[name];
                    }
                // If target is observable and source is not, then set the targets content with the source value
                } else if (ko.isObservable(object[name]) && !ko.isObservable(values[name])) {
                    object[name](values[name]);
                // If target is not an observable and source is, then set the targets with the source content
                } else if (!ko.isObservable(object[name]) && ko.isObservable(values[name])) {
                    object[name] = values[name]();
                // If both are not observables
                } else if (!ko.isObservable(object[name]) && !ko.isObservable(values[name])) {
                    // Check if the parameter should be a callback, if not set the value
                    if (!self.isFunction(object[name])) {
                        object[name] = values[name];
                    } else {
                        // If the parameter should be a callback and the target is a function then replace it.
                        if (self.isFunction(values[name])) {
                            object[name] = values[name];
                        } else {
                            // Err if not's a callback
                            if (self.isDefined(values[name])) {
                                throw 'The parameter ' + name + ' must be a callback.');
                            }
                        }
                    }
                }
            }
        }
    }

    // Define child components, used in conjunction with the vm binding, it obtains the childs viewmodels
    // and waits for them to be fully binded, then it invokes the callback or the object's ready function if defined.
    this.components = function(childs, object, callback) {
        // Checks the childs definition object
        if (!self.isObject(childs)) {
            throw 'You must specify a childs config object';
        }

        // Checks the target object
        if (!self.isDefined(object)) {
            throw 'You must specify the viewmodel of the component in wich to load the child viewmodels.';
        }

        // Check if there is a 'childs' property on the component
        if (self.isDefined(object['_tracking'])) {
            console.warn('The object already contains a property _tracking, it will be replaced by the tracking array');
        }

        // Sets the childs array wich tracks the dependencies and state
        object.tracking = {
            childs: {};
        }

        // For each expected dependency..
        for (var name in childs) {
            // Start tracking the dependency
            object.tracking.childs[name] = {};

            // Define a function to call when the child finishes loading.
            // PropertyName contains the child name, and vm the corresponding viewmodel
            object.tracking.childs[name]['load'] = function(propertyName, vm) {
                // Sets the child viemodel and marks it as loaded
                if (ko.isObservable(object[propertyName])) {
                    object[propertyName](vm);
                } else {
                    object[propertyName] = vm;
                }
                object.tracking.childs.[propertyName]['loaded'] = true;

                if (self.isDefined(vm.tracking)) {
                    // If the child has dependencies mark the dependency as not ready and save
                    // the parent data (reference and state)
                    object.tracking.childs[propertyName]['ready'] = false;

                    vm.tracking.parent = object;
                    vm.tracking.parentState = object.tracking.childs[propertyName];
                } else {
                    // If the child hasn't dependencies mark the dependency on parent as ready
                    object.tracking.childs[propertyName]['ready'] = true;

                    // If there's a ready function on the child invoke it
                    if (self.isDefined(vm['ready'])) {
                        vm['ready']();
                    }
                }

                // If any property in the child is not loaded then exit
                // !! OPTIMIZE !! by using a counter and not iterating all array over and over
                for (var property in childs) {
                    if (!object.tracking.childs[property]['loaded']) {
                        return;
                    }
                }

                // If any property in the child is not ready then exit
                // !! OPTIMIZE !! by using a counter and not iterating all array over and over
                for (var property in childs) {
                    if (!object.tracking.childs[property]['ready']) {
                        return;
                    }
                }

                // If this point is reached then all dependencies are loaded and ready.
                // So, invoke the callback (if it's defined)
                if (self.isDefined(callback)) {
                    callback();
                }

                // And the ready method...
                if (self.isFunction(object['ready'])) {
                    object['ready']();
                }

                // Finally if the object is tracked and has a parent, mark itself as ready on the parent
                // object and call the function on the parent to reevaluate readiness.
                if (self.isDefined(object['tracking']) && self.isDefined(object.tracking['parent'])) {
                    object.tracking.parentState['ready'] = true;
                    object.tracking.parent.childReady();
                }
            }

            // Initialize the tracking of the child component
            object.tracking.childs[name]['loaded'] = false;

            // Defines a function to call when one of its childs is ready.
            // It forces the object to reevaluate its readiness
            object.tracking.childReady = function() {
                // If there is a child that is not ready the exits
                for (var property in childs) {
                    if (!object.tracking.childs[property]['ready']) {
                        return;
                    }
                }

                // At this point, all childs are ready, therefore the object itself is ready
                // So, invoke the callback (if it's defined)
                if (self.isDefined(callback)) {
                    callback();
                }

                // And the ready method...
                if (self.isFunction(object['ready'])) {
                    object['ready']();
                }

                // Finally if the object is tracked and has a parent, mark itself as ready on the parent
                // object and call the function on the parent to reevaluate readiness.
                if (self.isDefined(object['parent'])) {
                    object.traking.parentState['ready'] = true;
                    object.tracking.parent.childReady();
                }
            }

            // Import the dependency to the target object
            object[name] = childs[name];
        }
    }

    // Copies one object into other. If recursively is false or not specified it copies all properties in the "to" object
    // that exists in "from" object, if recursively is true does the same with each property (copying object graphs)
    this.inject = function (from, to, recursively) {
        if (!self.isDefined(from)) {
            return;
        }

        if (!self.isDefined(to)) {
            return;
        }

        for (var name in from) {
            if (self.isDefined(to[name])) {
                var value;

                if (ko.isObservable(from[name])) {
                    value = from[name]();
                } else {
                    value = from[name];
                }

                if (ko.isObservable(to[name])) {
                    if (recursively && self.isObject(to[name]())) {
                        self.inject(to[name](), value);
                    } else {
                        to[name](value);
                    }
                } else {
                    if (recursively && self.isObject(to[name])) {
                        self.inject(to[name], value);
                    } else {
                        to[name] = value;
                    }
                }
            }
        }
    }
}
