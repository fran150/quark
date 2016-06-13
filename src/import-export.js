// Marks the object as ready and inform its parent (if is tracking dependencies)
function markReadyAndInformParent(model, imports) {
    // Calls the object ready method and unlocks the readyLock
    callReady(model);

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
    imports.$support.tracking.childs[name]['load'] = function(propertyName, vm) {
        // Sets the child viemodel and marks it as loaded
        imports[propertyName] = vm;
        imports.$support.tracking.childs[propertyName]['loaded'] = true;

        callLoaded(imports, propertyName, vm);

        // Save the property name
        imports.$support.tracking.childs[propertyName]['propertyName'] = propertyName;

        // If the child is tracking dependencies itself...
        if ($$.isDefined(vm.$support) && $$.isDefined(vm.$support.tracking)) {
            // If the child has dependencies mark the dependency as not ready and save
            // the parent data (reference and state)
            imports.$support.tracking.childs[propertyName]['ready'] = false;

            vm.$support.tracking.parent = imports;
            vm.$support.tracking.parentState = imports.$support.tracking.childs[propertyName];
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

function addExportBinding(element, name) {
    if (element.nodeType != 8) {
        // Search for the model-bind attribute in the virtual tag
        var match = element.nodeValue.match(/model-bind[\s]*=[\s]*[\'\"][\s\S]+?[\'\"]/);

        // If a match is found create the binding in the model space
        if (match) {
            var content = match.match(/[\'\"][\s\S]+?[\'\"]/);

            if (content) {
                var newContent = content + ", export: '" + name + "'";
                content.replace(content, newContent);
            }
        } else {
            element.nodeValue += "model-bind=\"export: '" + name + "'\"";
        }
    } else {
        // If node is a normal tag, check if it has attributes
        if (element.attributes) {
            // Then search along the element's attributes and trying to find the "model-bind" attribute.
            for (var i = 0; i < element.attributes.length; i++) {
                var attrib = element.attributes[i];

                // If found create the binding in the model space
                if (attrib.specified) {
                    if (attrib.name == "model-bind") {
                        attrib.value += ", export='" + name + "'";
                        return;
                    }
                }
            }
        }

        var attrib = document.createAttribute("model-bind");
        attrib.value += "export='" + name + "'";
    }
}

ko.bindingHandlers.import = {
    init: function(element, valueAccessor, allBindings, viewModel, context) {
        // Gets the name of the property in wich to import the viewmodel
        var name = valueAccessor();

        var model;
        var imports;

        // If the target object has "model" and "imports" properties, then assume that is a quark scope and
        // extract the model and imports object, if it's not a quark scope use the same object as both model and imports
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

        addExportBinding(element, name);
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
