// Loaded behaviours array
var behaviours = {};

// Loads a behaviour with the specified name
$$.behaviour = function(name, behaviour, dispose) {
    // Warn if repeated
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
function applyBehaviour(object, behaviourName) {
    // Error if behaviour name is not a string
    if (!$$.isString(behaviourName)) {
        throw 'The behaviour name must be an string. If you specified an array check that all elements are valid behaviour names';
    }

    // Chek if behaviour exists
    if (behaviours[behaviourName]) {
        // Apply new behaviour
        behaviours[behaviourName](object);

        if (!$$.isDefined(object.behaviours)) {
            object.behaviours = {};
        }

        object.behaviours[behaviourName] = true;
    } else {
        throw 'The are no behaviours loaded with the name ' + behaviourName + '.';
    }
}

// Applies the behaviour to the object. You can specify a string with the name of a loaded behaviour
// or an array of behaviour names.
$$.behave = function(object, behaviour) {
    // Validates object
    if (!$$.isObject(object)) {
        throw 'You must specifify a valid object to apply the behaviour.';
    }

    if ($$.isArray(behaviour)) {
        // If it's an array we iterate it applying each behaviour
        for (var i = 0; i < behaviour.length; i++) {
            applyBehaviour(object, behaviour[i]);
        }
    } else if ($$.isString(behaviour)) {
        // If it's a string apply the named behaviour
        applyBehaviour(object, behaviour);
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
    if ($$.isDefined(object.behaviours)) {
        if ($$.isDefined(object.behaviours[behaviourName])) {
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

    if ($$.isDefined(object.behaviours)) {
        for (var name in object.behaviours) {
            var behaviour = object.behaviours[name];

            if (behaviour.dispose) {
                behaviour.dispose(object);
            }
        }
    }
}
