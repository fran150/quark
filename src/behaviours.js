// Loaded behaviours array
var behaviours = {};

// Define a behaviour with the specified name.
// Behaviours allows to attach functionality to an object. This makes possible to share the same code across various classes
// enabling a sort of hierachy.
// If an object has an specific behaviour we can assume it will have certain methods and properties associated with the behaviour.
// Basically a behaviour definition is a function that receives and object and a configuration and attaches the required methods
// and properties.
// The first parameter is the name of the behaviour, it will be used when applying this behaviour to an object.
// The second parameter is a function that accepts a parameter with the object to wich the behaviour must be applied
// The last parameter allows to define a function that runs when the object with this behaviour is disposed. This function must accept
// as parameter the object that is being disposed.
$$.behaviour = function(name, behaviour, dispose) {
    // Warn if behaviour is repeated
    if ($$.behaviour[name]) {
        console.warn('There was already a behaviour loaded with the name ' + name + '. It will be replaced with the new one.');
    }

    // Error if behaviour name is not a string
    if (!$$.isString(name)) {
        throw 'The behaviour name must be an string.';
    }

    // Error if behaviour is not a function
    if (!$$.isFunction(behaviour)) {
        throw 'The behaviour must be a function that takes an object as a parameter an applies the new functionality to it.';
    }

    // Error if behaviour dispose is defined but not a function
    if ($$.isDefined(dispose) && !$$.isFunction(dispose)) {
        throw 'The behaviour dispose must be a function that performs cleanup of the behaviour when disposing.';
    }

    // Define the disposal of the behaviour
    behaviour.dispose = dispose;

    // Adds the new behaviour to the table
    behaviours[name] = behaviour;
}

// Applies a behaviour to the object
function applyBehaviour(behaviourName, object, config) {
    // Error if behaviour name is not a string
    if (!$$.isString(behaviourName)) {
        throw 'The behaviour name must be an string. If you specified an array check that all elements are valid behaviour names';
    }

    // Check if behaviour exists
    if (behaviours[behaviourName]) {
        // Apply new behaviour by calling the behaviour definition function with the target object and
        // the behaviour config
        behaviours[behaviourName](object, config);

        // Check if there's a $support variable on the object and if not create one. (Used by quark to store metadata)
        if (!$$.isDefined(object.$support)) {
            object.$support = {};
        }

        // Check if there's a behaviour array on the object. (Used to maintain the applied behaviours list)
        if (!$$.isDefined(object.$support.behaviours)) {
            object.$support.behaviours = {};
        }

        // Add the applied behaviour to the list
        object.$support.behaviours[behaviourName] = true;
    } else {
        throw 'The are no behaviours loaded with the name ' + behaviourName + '.';
    }
}

// Applies the behaviour to the object. You can specify a string with the name of a defined behaviour
// or an array of behaviour names.
$$.behave = function(behaviour, object, config) {
    // Validates object
    if (!$$.isObject(object)) {
        throw 'You must specifify a valid object to apply the behaviour.';
    }

    if ($$.isArray(behaviour)) {
        // If it's an array we iterate it applying each behaviour
        for (var i = 0; i < behaviour.length; i++) {
            applyBehaviour(behaviour[i], object, config);
        }
    } else if ($$.isString(behaviour)) {
        // If it's a string apply the named behaviour
        applyBehaviour(behaviour, object, config);
    } else {
        // Everything else fails
        throw 'The behaviour name must be an string or an array of strings.';
    }
}

// Checks if the behaviour has been added to the object
$$.hasBehaviour = function(object, behaviourName) {
    // Validates object
    if (!$$.isObject(object)) {
        throw 'You must specifify a valid object to check the behaviour.';
    }

    // Error if behaviour name is not a string
    if (!$$.isString(behaviourName)) {
        throw 'The behaviour name must be an string.';
    }

    // Check if the object has the specified behaviour added
    if ($$.isDefined(object.$support) && $$.isDefined(object.$support.behaviours)) {
        if ($$.isDefined(object.$support.behaviours[behaviourName])) {
            return true;
        }
    }

    return false;
}

// Disposes object behaviours
$$.disposeBehaviours = function(object) {
    // Validates object
    if (!$$.isObject(object)) {
        throw 'You must specifify a valid object to apply the behaviour.';
    }

    // If theres a quark metadata defined with behaviours
    if ($$.isDefined(object.$support) && $$.isDefined(object.$support.behaviours)) {
        // Iterate applied behaviours calling the dispose function of each behaviour and passing the disposed object on each
        for (var name in object.$support.behaviours) {
            var behaviour = object.$support.behaviours[name];

            if (behaviour.dispose) {
                behaviour.dispose(object);
            }
        }
    }
}
