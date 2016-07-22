// Calls the ready method on the model and marks as ready on the parent if is tracking dependencies, then calls the function
// to reevaluate the parent's readiness
function markReadyAndInformParent(model, imports) {
    // Calls the object ready method and unlocks the readyLock
    callReady(model, imports);

    // If the object is tracked and has a parent, mark itself as ready on the parent
    // and call the function on the parent to reevaluate readiness.
    if ($$.isDefined(imports.$support) && $$.isDefined(imports.$support.tracking) && $$.isDefined(imports.$support.tracking.parent)) {
        // Mark the object ready on the parent
        imports.$support.tracking.parentState['ready'] = true;

        // Call the readied method and signal
        callReadied(imports.$support.tracking.parent, imports.$support.tracking.parentState.propertyName, imports);

        // Inform to the tracking system on the parent that a child is ready
        imports.$support.tracking.parent.$support.tracking.childReady();
    }
}

// Check if the object is ready verifying that all tracked childs are loaded and ready
function checkObjectReady(imports) {
    // If any dependency is not loaded or ready then exit
    // !! OPTIMIZE !! by using a counter and not iterating all array over and over
    for (var property in imports.$support.tracking.childs) {
        if (!imports.$support.tracking.childs[property]['loaded'] || !imports.$support.tracking.childs[property]['ready']) {
            return false;
        }
    }

    return true;
}

// Calls the object's readied function and signals passing the property name and model
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

// Calls the object's loaded function and signals passing the property name and model
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

// Call Ready function and open lock on the object
function callReady(model, imports) {
    // If there´s a ready callback on the object invoke it
    if ($$.isFunction(imports['ready'])) {
        imports['ready']();
    }

    // If theres a ready lock on the object unlock it
    if ($$.isDefined(model['readyLock'])) {
        model.readyLock.unlock();
    }
}

// Start tracking the loading state of a child object.
function initTracking(model, imports, name) {
    // If the specified binding is not an string throw an error (to avoid a common mistake)
    if (!$$.isString(name)) {
        throw 'The import value must be an string with the name of the property to create on the parent object';
    }

    // If the target object doesn´t have a $support property initialize it
    if (!$$.isObject(imports.$support)) {
        imports.$support = {};
    }

    // Sets the childs array wich tracks the dependencies and state of each viewModel to import
    if (!$$.isObject(imports.$support.tracking)) {
        imports.$support.tracking = {
            childs: {}
        }
    }

    // Creates a ready lock to fire when the object is ready
    model.readyLock = $$.lock();

    // Creates a signal to fire when a dependency loads
    imports.loadedSignal = $$.signal();

    // Creates a signal to fire when a dependency is ready
    imports.readiedSignal = $$.signal();

    // Start tracking the dependency with the specified name.
    imports.$support.tracking.childs[name] = {};

    // The child components uses this function to notify that it finished loading.
    // PropertyName contains the child name, and vm the corresponding viewmodel.
    imports.$support.tracking.childs[name]['load'] = function(propertyName, vm, imp) {
        // Sets the child viewmodel and marks it as loaded
        imports[propertyName] = vm;
        imports.$support.tracking.childs[propertyName]['loaded'] = true;

        callLoaded(imports, propertyName, vm);

        // Save the property name
        imports.$support.tracking.childs[propertyName]['propertyName'] = propertyName;

        // If the child is tracking dependencies itself...
        if ($$.isDefined(imp.$support) && $$.isDefined(imp.$support.tracking)) {
            // If the child has dependencies mark the dependency as not ready and save
            // the parent data (reference and state)
            imports.$support.tracking.childs[propertyName]['ready'] = false;

            imp.$support.tracking.parent = imports;
            imp.$support.tracking.parentState = imports.$support.tracking.childs[propertyName];
        } else {
            // If the child hasn't dependencies mark the dependency on parent as ready
            imports.$support.tracking.childs[propertyName]['ready'] = true;

            callReadied(imports, propertyName, vm);
        }

        // If the object is ready, mark it and inform its parent
        if (checkObjectReady(imports)) {
            markReadyAndInformParent(model, imports);
        }
    }

    // Initialize the tracking flag of the child component loaded state
    imports.$support.tracking.childs[name]['loaded'] = false;

    // Defines a function to call when one of this object childs is ready.
    // It forces the object to reevaluate this object readiness
    imports.$support.tracking.childReady = function(propertyName, vm) {
        // If the object is ready, mark it and inform its parent
        if (checkObjectReady(imports)) {
            markReadyAndInformParent(model, imports);
        }
    }
}

// Add the export binding to the model-bindings of this component.
function addExportBinding(element, name, bindName) {
    // If the element is virtual
    if (element.nodeType == 8) {
        // Search for the model-bind attribute in the virtual tag
        var match = element.nodeValue.match(/model-bind[\s]*:[\s]*\"[\s\S]*?\"/);

        // If a match is found
        if (match) {
            // Get the content of the binding
            var content = match[0].match(/\"[\s\S]*?\"/);

            // If content is found add the specified binding to the existing
            if (content) {
                var start = content[0].indexOf('\"') + 1;
                var end = content[0].indexOf('\"', start);

                var value = content[0].substring(start, end);

                var newContent = "\"" + value;

                if (value) {
                    newContent += ", ";
                }

                newContent += bindName + ": '" + name + "'\"";
                element.nodeValue = element.nodeValue.replace(content[0], newContent);
            }
        } else {
            // If the model-bind attribute is not found create it with the specified binding
            element.nodeValue += "model-bind: \"" + bindName + ": \'" + name + "\'\"";
        }
    } else {
        var found = false;

        // If node is a normal tag, check if it has attributes
        if (element.attributes) {
            // Then search along the element's attributes and trying to find the "model-bind" attribute.
            for (var i = 0; i < element.attributes.length; i++) {
                var attrib = element.attributes[i];

                // If found create the binding in the model space
                if (attrib.specified) {
                    if (attrib.name == "model-bind") {
                        if (attrib.value) {
                            attrib.value += ", ";
                        }

                        attrib.value += bindName + ": '" + name + "'";
                        found = true;
                    }
                }
            }
        }

        // If the model-bind tag is not found create it with the specified tag
        if (!found) {
            var attrib = element.setAttribute("model-bind", bindName + ": '" + name + "'");
        }
    }
}
// Imports the component to its parent
ko.bindingHandlers.import = {
    init: function(element, valueAccessor, allBindings, viewModel, context) {
        // Gets the name of the property in wich to import the viewmodel
        var name = valueAccessor();

        var model;
        var imports;

        // If the target object has "model" and "imports" properties, then assume that is a quark scope and
        // extract the model and imports object
        if (viewModel && viewModel.imports && viewModel.model) {
            model = viewModel.model;
            imports = viewModel.imports;
        } else {
            model = viewModel;
            imports = viewModel;
        }

        // Start tracking the loading of imported childs
        initTracking(model, imports, name);

        // Init the dependency property in the target object
        imports[name] = {};

        // Adds the export binding to the element
        addExportBinding(element, name, 'export');
    }
}
ko.virtualElements.allowedBindings.import = true;

function callLoadMethod(property, imports, context) {
    // Check if the viewmodel is tracking childs properties
    if ($$.isDefined(imports.$support) && $$.isDefined(imports.$support.tracking)) {
        if ($$.isDefined(imports.$support.tracking['childs'])) {
            // If the viewmodel is tracking a model to be loaded in a property with the specified name
            if ($$.isDefined(imports.$support.tracking.childs[property])) {
                // Call the load method of the tracking object passing the child object with the viewModel of the child component
                imports.$support.tracking.childs[property]['load'](property, context.$container, context.$containerContext.$data.getImports());
            } else {
                throw 'The specified object doesn´t have a property named ' + property + '. Verify that the object has a property defined with the .components method with the name defined in the vm binding.';
            }
        } else {
            throw 'The specified object doesn´t have the tracking property. This usually is because you don´t used the function .components to set the properties where the vm binding has to set the viewmodel';
        }
    } else {
        throw 'The specified object doesn´t have the tracking.childs property. This usually is because you don´t used the function .components to set the properties where the vm binding has to set the viewmodel';
    }
}


ko.bindingHandlers.export = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value;

        // Get's the binded value
        value = ko.unwrap(valueAccessor());

        // If the binding model has "model" and "imports" properties we assume that is a quark-component's scope.
        if (viewModel && viewModel.model && viewModel.imports) {
            viewModel = viewModel.imports;
        }

        var property;

        if ($$.isString(value)) {
            property = value;
        } else {
            throw 'The value of the vm value must be an string with the name of the property where quark must load the viewmodel of the nested component';
        }

        callLoadMethod(property, viewModel, context);
    }
}
ko.virtualElements.allowedBindings.export = true;

ko.bindingHandlers.exportToController = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value;

        // Get's the binded value
        value = ko.unwrap(valueAccessor());

        // Get the current route
        var current = $$.routing.current();

        // If theres a controller on the current route
        if (current && current.controller) {
            var value;

            // Get's the binded value
            value = ko.unwrap(valueAccessor());

            // If the binding model has "model" and "imports" properties we assume that is a quark-component's scope.
            if (routers[current.locationName].routes[current.routeName].controllerImports) {
                viewModel = routers[current.locationName].routes[current.routeName].controllerImports;
            }

            var property;

            if ($$.isString(value)) {
                property = value;
            } else {
                throw 'The value of the vm value must be an string with the name of the property where quark must load the viewmodel of the nested component';
            }

            callLoadMethod(property, viewModel, context);
        }
    }
}
ko.virtualElements.allowedBindings.exportToController = true;
