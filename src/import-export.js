// Marks the object as ready and inform its parent (if is tracking dependencies)
function markReadyAndInformParent(object) {
    callReady(object);

    // Finally, if the object is tracked and has a parent, mark itself as ready on the parent
    // and call the function on the parent to reevaluate readiness.
    if ($$.isDefined(object.$support) && $$.isDefined(object.$support.tracking) && $$.isDefined(object.$support.tracking.parent)) {
        // Mark the object ready on the parent
        object.$support.tracking.parentState['ready'] = true;

        callReadied(object.$support.tracking.parent, object.$support.tracking.parentState.propertyName, object);

        // Inform to the tracking system on the parent that a child is ready
        object.$support.tracking.parent.$support.tracking.childReady();
    }
}

function checkObjectReady(object) {
    // If any dependency is not loaded or ready then exit
    // !! OPTIMIZE !! by using a counter and not iterating all array over and over
    for (var property in object.$support.tracking.childs) {
        if (!object.$support.tracking.childs[property]['loaded'] || !object.$support.tracking.childs[property]['ready']) {
            return false;
        }
    }

    return true;
}

// Calls the object's readied function and signals
function callReadied(object, propertyName, vm) {
    // If theres a readied function on the object call it passing the dependency name and model
    if ($$.isDefined(object['readied'])) {
        object.readied(propertyName, vm);
    }

    // If theres a readied signal on the object dispatch it with the readied object
    if ($$.isDefined(object['readiedSignal'])) {
        object.readiedSignal.dispatch(propertyName, vm);
    }
}

// Calls the object's loaded function and signals
function callLoaded(object, propertyName, vm) {
    // If theres a loaded function on the object call it passing the dependency name and model
    if ($$.isDefined(object['loaded'])) {
        object.loaded(propertyName, vm);
    }

    // If theres a loaded signal on the object dispatch it with the readied object
    if ($$.isDefined(object['loadedSignal'])) {
        object.loadedSignal.dispatch(propertyName, vm);
    }
}

// Call Ready function and signals on the object
function callReady(object) {
    // If there´s a ready callback on the object invoke it
    if ($$.isFunction(object['ready'])) {
        object['ready']();
    }

    // If theres a ready lock on the object unlock it
    if ($$.isDefined(object['readyLock'])) {
        object.readyLock.unlock();
    }
}

function initTracking(object, name) {
    // If the specified binding is not an string throw an error (to avoid a common mistake)
    if (!$$.isString(name)) {
        throw 'The import value must be an string with the name of the property to create on the parent object';
    }

    // If the target object doesn´t have a $support property initialize it
    if (!$$.isObject(object.$support)) {
        object.$support = {};
    }

    // Sets the childs array wich tracks the dependencies and state of each viewModel to import
    if (!$$.isObject(object.$support.tracking)) {
        object.$support.tracking = {
            childs: {},
        }
    }

    // Creates a ready lock to fire when the object is ready
    object.readyLock = $$.lock();

    // Creates a signal to fire when a dependency loads
    object.loadedSignal = $$.signal();

    // Creates a signal to fire when a dependency is ready
    object.readiedSignal = $$.signal();

    // Start tracking the dependency with the specified name.
    object.$support.tracking.childs[name] = {};

    // The child components uses this function to notify that it finished loading.
    // PropertyName contains the child name, and vm the corresponding viewmodel.
    object.$support.tracking.childs[name]['load'] = function(propertyName, vm) {
        // Sets the child viemodel and marks it as loaded
        object[propertyName] = vm;
        object.$support.tracking.childs[propertyName]['loaded'] = true;

        callLoaded(object, propertyName, vm);

        // Save the property name
        object.$support.tracking.childs[propertyName]['propertyName'] = propertyName;

        // If the child is tracking dependencies itself...
        if ($$.isDefined(vm.$support) && $$.isDefined(vm.$support.tracking)) {
            // If the child has dependencies mark the dependency as not ready and save
            // the parent data (reference and state)
            object.$support.tracking.childs[propertyName]['ready'] = false;

            vm.$support.tracking.parent = object;
            vm.$support.tracking.parentState = object.$support.tracking.childs[propertyName];
        } else {
            // If the child hasn't dependencies mark the dependency on parent as ready
            object.$support.tracking.childs[propertyName]['ready'] = true;

            callReadied(object, propertyName, vm);
        }

        // If the object is ready, mark it and inform its parent
        if (checkObjectReady(object)) {
            markReadyAndInformParent(object);
        }
    }

    // Initialize the tracking flag of the child component loaded state
    object.$support.tracking.childs[name]['loaded'] = false;

    // Defines a function to call when one of this object childs is ready.
    // It forces the object to reevaluate this object readiness
    object.$support.tracking.childReady = function(propertyName, vm) {
        // If the object is ready, mark it and inform its parent
        if (checkObjectReady(object)) {
            markReadyAndInformParent(object);
        }
    }
}

// This binding allows to import the viewmodel of a component into the parent creating a property with the specified name.
// This binding is executed at the target object context in the custom tag of the component to import. The component to import
// is not loaded when this binds, so it creates an array to track whem each dependency loads. When the dependency loads,
// it creates a property with the specified name in the parent and sets the child's viewmodel in it.
// This binding only prepares the parent object to track dependencies, each dependency inform that it has loaded in the export
// binding.
// We call a component "loaded" when is binded and his model loaded, but his dependencies may not be loaded yet.
// We call a component to be "ready" when is loaded and all it's dependencies are loaded and ready.
// When each dependendy loads calls the "loaded" function passing the dependency name (specified in it's import binding)
// and the loaded model.
// When each dependendy is ready calls the "readied" function passing the dependency name (specified in it's import binding)
// and the loaded model.
// When all dependencies are loaded calls the ready method on the object (if its defined)
ko.bindingHandlers.import = {
    init: function(element, valueAccessor, allBindings, viewModel, context) {
        // Gets the name of the property in wich to import the viewmodel
        var name = valueAccessor();

        var object;

        // If the target object has a model (is a quark-component's scope) set the target object to the model,
        // if not the target is the object itself.
        if (viewModel && viewModel.imports) {
            object = viewModel.imports;
        } else {
            object = viewModel;
        }

        initTracking(object, name);

        // Import the dependency to the target object
        object[name] = {};

        // The qk- tags define bindings that must be executed when the component is loaded, this
        // bindings are executed in the "modelExporter" passing the child model in the $child property of the context.
        //
        // Depending if its a virtual o normal tag use one or other notation to mark the child
        // element to indicate that it has to be exported to the parent using the export binding.
        if (element.nodeType != 8) {
            element.setAttribute('qk-export', "\'" + name + "\'");
        } else {
            element.data += " qk-export=\'" + name + "\'";
        }
    }
}
ko.virtualElements.allowedBindings.import = true;

// Exports the component viewmodel to the parent object
// This binding is used with the qk- attributes. You can define bindings that executes when the components is used as attributes
// in the components tag. For example <some-component qk-export="'test'"> calls the binding "export" when the component is loaded
// passing the 'test' string as value. The bindings defined in this way executes in the modelExporter wich binds in a custom context
// that has the child model on the $child property.
// This binding is the other leg of the import binding, the "import" begins to track the dependencies and sets a qk-export attribute
// on the object's element. This is a binding that executes when the child component is loaded and marks the component as loaded
// on the parent using the functions created by the import binding.
ko.bindingHandlers.export = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value;
        // Get's the binded value
        value = ko.unwrap(valueAccessor());

        // If the binding model has a model (is a quark-component's scope), the binding will be against the model.
        if (viewModel && viewModel.imports) {
            viewModel = viewModel.imports;
        }

        var property;

        // If the binding value is a string then is the name of a property in the viewmodel,
        // if not, must be an object indicating the target viewModel and the property in wich to set the dependency model
        if (!$$.isString(value)) {
            if ($$.isObject(value)) {
                if ($$.isString(value['property'])) {
                    property = value['property'];
                }

                if ($$.isDefined(value['model'])) {
                    viewModel = value['model'];
                }
            }
        } else {
            property = value;
        }

        // Validates objects and calls the load function on the parent (marking this component as loaded on the parent)
        if ($$.isString(property)) {
            if ($$.isDefined(viewModel.$support) && $$.isDefined(viewModel.$support.tracking)) {
                if ($$.isDefined(viewModel.$support.tracking['childs'])) {
                    if ($$.isDefined(viewModel.$support.tracking.childs[property])) {
                        viewModel.$support.tracking.childs[property]['load'](property, context.$child);
                    } else {
                        throw 'The specified object doesn´t have a property named ' + value + '. Verify that the object has a property defined with the .components method with the name defined in the vm binding.';
                    }
                } else {
                    throw 'The specified object doesn´t have the tracking property. This usually is because you don´t used the function .components to set the properties where the vm binding has to set the viewmodel';
                }
            } else {
                throw 'The specified object doesn´t have the tracking.childs property. This usually is because you don´t used the function .components to set the properties where the vm binding has to set the viewmodel';
            }
        } else {
            throw 'The value of the vm value must be an string with the name of the property where quark must load the viewmodel of the nested component';
        }
    }
}
ko.virtualElements.allowedBindings.export = true;

ko.bindingHandlers.exporttocontroller = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value;
        // Get's the binded value
        value = ko.unwrap(valueAccessor());

        var current = $$.routing.current();

        if (current && current.controller) {
            viewModel = current.controller;


            var property;

            // If the binding value is a string then is the name of a property in the viewmodel,
            // if not, must be an object indicating the target viewModel and the property in wich to set the dependency model
            if (!$$.isString(value)) {
                if ($$.isObject(value)) {
                    if ($$.isString(value['property'])) {
                        property = value['property'];
                    }

                    if ($$.isDefined(value['model'])) {
                        viewModel = value['model'];
                    }
                }
            } else {
                property = value;
            }

            // Validates objects and calls the load function on the parent (marking this component as loaded on the parent)
            if ($$.isString(property)) {
                if ($$.isDefined(viewModel.$support) && $$.isDefined(viewModel.$support.tracking)) {
                    if ($$.isDefined(viewModel.$support.tracking['childs'])) {
                        if ($$.isDefined(viewModel.$support.tracking.childs[property])) {
                            viewModel.$support.tracking.childs[property]['load'](property, context.$child);
                        } else {
                            throw 'The specified object doesn´t have a property named ' + value + '. Verify that the object has a property defined with the .components method with the name defined in the vm binding.';
                        }
                    } else {
                        throw 'The specified object doesn´t have the tracking property. This usually is because you don´t used the function .components to set the properties where the vm binding has to set the viewmodel';
                    }
                } else {
                    throw 'The specified object doesn´t have the tracking.childs property. This usually is because you don´t used the function .components to set the properties where the vm binding has to set the viewmodel';
                }
            } else {
                throw 'The value of the vm value must be an string with the name of the property where quark must load the viewmodel of the nested component';
            }
        }
    }
}
ko.virtualElements.allowedBindings.exporttocontroller = true;
