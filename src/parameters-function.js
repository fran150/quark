import ko from 'knockout';
import is from './is';
import utils from './utils';

/**
 * Process the parameters when the object is observable
 * @param {string} name Name of the parameter
 * @param {any} object Target object
 * @param {any} values Parameters values
 */
function processIfObjectIsObservable(name, object, values) {
  // If both target and source params are observable try to overwrite it
  if (ko.isObservable(values[name])) {
    object[name] = values[name];
  } else if (!ko.isObservable(values[name])) {
    // If target is observable and source is not, then set the targets
    // content with the source value
    object[name](values[name]);
  }
}

/**
 * Process the parameters when the object is not observable
 * @param {string} name Name of the parameter
 * @param {any} object Target object
 * @param {any} values Parameters values
 */
function processIfObjectIsNotObservable(name, object, values) {
  // If target is not observable but parameter replace the value
  if (ko.isObservable(values[name])) {
    object[name] = values[name]();
  } else {
    // If both are not observables
    // Check if the parameter should be a callback
    if (!is.function(object[name])) {
      processIfObjectIsNotFunction(name, object, values);
    } else {
      processIfObjectIsFunction(name, object, values);
    }
  }
}

/**
 * Process the parameters when the object is a callback
 * @param {string} name Name of the parameter
 * @param {any} object Target object
 * @param {any} values Parameters values
 */
function processIfObjectIsFunction(name, object, values) {
  // If they are both object process them as sub parameters
  if (is.object(params[name]) && is.object(values[name])) {
    processParameters(params[name], values[name], object[name]);
  } else {
    object[name] = values[name];
  }
}

/**
 * Process the parameters when the object is not a callback
 * @param {string} name Name of the parameter
 * @param {any} object Target object
 * @param {any} values Parameters values
 */
function processIfObjectIsNotFunction(name, object, values) {
  // If the parameter should be a callback and the target is a function
  // then replace it.
  if (is.function(values[name])) {
    object[name] = values[name];
  } else {
    // Err if not's a callback
    if (is.defined(values[name])) {
      throw new Error('The parameter ' + name + ' must be a callback.');
    }
  }
}

/**
 * This function allows to define the accepted parameters of a
 * quark component.<br/>
 * For each parameter defined:<br/>
 * If the defined parameter is an observable, check the received parameter
 * with the same name:
 * <ul>
 *   <li>f its an observable replace the defined with the received
 *   observable.</li>
 *   <li>If its not an observable set the received value in defined
 *   the observable.
 * </ul>
 * If the defined parameters is not an observable, check the received
 * parameter with the same name:
 * <ul>
 *   <li>If its an observable set the defined parameter value with
 *   the received observable's content.</li>
 *   <li>if its not an observable set the received value in the
 *   defined parameter.</li>
 * </ul>
 * This allows the defined parameter to maintain it's type while populating
 * with the received values, and in the case of observables allows components
 * to share an observable.
 *
 * @param {any} params object with parameters name and the default value.
 * @param {any} values An object with the parameter values, you can pass
 * here the first parameter received in the component model.
 * @param {any} objects object or an array of objects. Quark will create
 * a property for each parameter in the specified objects
 **/
function processParameters(params, values, objects) {
  // Checks the parameters configuration object
  if (!is.object(params)) {
    throw new Error('You must specify a parameters config object');
  }

  // Checks the values object
  if (!is.object(values)) {
    throw new Error('You must specify the configured values for the ' +
        'component, usually you can obtain it from the parameters ' +
        'array received in the component\'s constructor.');
  }

  // Check the objects parameter
  if (!is.defined(objects)) {
    throw new Error('You must specify the viewmodel of the component ' +
        'in wich to load the parameters.');
  }

  // If objects parameter is not array create one with the specified value
  if (!is.array(objects)) {
    objects = Array(objects);
  }

  // Iterate the parameters
  utils.each(params, function(name) {
    // Iterate the target objects
    for (let i = 0; i < objects.length; i++) {
      // Get the target object
      const object = objects[i];

      // Create an object property with the parameter
      object[name] = params[name];

      // If there is a value defined in the component tag for the parameter
      if (is.defined(values[name])) {
        if (ko.isObservable(object[name])) {
          processIfObjectIsObservable(name, object, values);
        } else {
          processIfObjectIsNotObservable(name, object, value);
        }
      }
    }
  });
};

export default processParameters;
