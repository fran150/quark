// Loaded behaviours array
function Behaviours() {
    var behaviours = {};

    // Define a behaviour with the specified name.
    // Behaviours allows to attach functionality to an object. This makes possible to share the same code across various classes
    // enabling a sort of hierachy.
    // If an object has an specific behaviour we can assume it will have certain methods and properties associated with the behaviour.
    // Basically, a behaviour definition is a function that receives a target object and a configuration
    // and attaches the required methods and properties based on the configuration to the target object.
    // The first parameter is the behaviour's name, it will be used when applying this behaviour to an object.
    // The second parameter is a function that accepts a parameter with the target object and a behaviour configuration.
    // The last parameter allows to define a function that accepts a target object and disposes the behaviour from the
    // the given object.
    this.define = function(name, behaviour, dispose) {
        // Warn if behaviour is repeated
        if (behaviours[name]) {
            console.warn('There was already a behaviour loaded with the name ' + name + '. It will be replaced with the new one.');
        }

        // Error if behaviour name is not a string
        if (!$$.isString(name)) {
            throw new Error('The behaviour name must be an string.');
        }

        // Error if behaviour is not a function
        if (!$$.isFunction(behaviour)) {
            throw new Error('The behaviour must be a function that takes an object as a parameter an applies the new functionality to it.');
        }

        // Error if behaviour dispose is defined but not a function
        if ($$.isDefined(dispose) && !$$.isFunction(dispose)) {
            throw new Error('The behaviour dispose must be a function that performs cleanup of the behaviour when disposing.');
        }

        // Adds the dispose method to the behaviour with the specified function
        behaviour.dispose = dispose;

        // Adds the new behaviour to the table
        behaviours[name] = behaviour;
    }

    // Applies a behaviour to the object
    function applyBehaviour(behaviourName, object, config) {
        // Error if behaviour name is not a string
        if (!$$.isString(behaviourName)) {
            throw new Error('The behaviour name must be an string. If you specified an array check that all elements are valid behaviour names');
        }

        // Check if behaviour exists
        if (behaviours[behaviourName]) {
            // Apply new behaviour by calling the behaviour definition function with the target object and
            // the behaviour config
            behaviours[behaviourName](object, config);

            // If the behaviours object is not defined, init an empty one
            if (!$$.isDefined(object.behaviours)) {
                object.behaviours = {};
            }

            // Add the applied behaviour to the list
            object.behaviours[behaviourName] = true;
        } else {
            throw new Error('The are no behaviours loaded with the name ' + behaviourName + '.');
        }
    }

    // Applies the behaviour to the object.
    // Behaviour is a string with the name of a defined behaviour
    // or an array of behaviour names.
    // Object is the target object
    // Config is the configuration of the behaviour or behaviours to apply
    this.apply = function(behaviour, object, config) {
        // Validates object
        if (!$$.isObject(object)) {
            throw new Error('You must specifify a valid object to apply the behaviour.');
        }

        // If an array of behaviours is specified
        if ($$.isArray(behaviour)) {
            // Iterate it applying each behaviour
            for (var i = 0; i < behaviour.length; i++) {
                applyBehaviour(behaviour[i], object, config);
            }
        } else if ($$.isString(behaviour)) {
            // If it's a string apply the named behaviour
            applyBehaviour(behaviour, object, config);
        } else {
            // Everything else fails
            throw new Error('The behaviour name must be an string or an array of strings.');
        }
    }

    // Checks if the behaviour has been added to the object
    this.has = function(behaviourName, object) {
        // Validates object
        if (!$$.isObject(object)) {
            throw new Error('You must specifify a valid object to check the behaviour.');
        }

        // Error if behaviour name is not a string
        if (!$$.isString(behaviourName)) {
            throw new Error('The behaviour name must be an string.');
        }

        if ($$.isDefined(object.behaviours) && $$.isDefined(object.behaviours[behaviourName])) {
            return true;
        }

        return false;
    }

    // Disposes object behaviours
    this.dispose = function(object) {
        // Validates object
        if (!$$.isObject(object)) {
            throw new Error('You must specifify a valid object to apply the behaviour.');
        }

        // If theres a behaviours property in the object
        if ($$.isDefined(object.behaviours)) {
            // Iterate applied behaviours calling the dispose function of each behaviour
            for (var name in object.behaviours) {
                // Get the behaviour
                var behaviour = behaviours[name];

                // If has a dispose method use it to clear the object
                if (behaviour && $$.isFunction(behaviours[behaviourName].dispose)) {
                    behaviours[behaviourName].dispose(object);
                }
            }
        }
    }
}

$$.behaviour = new Behaviours();
