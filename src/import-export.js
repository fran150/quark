// Add the model binding to the specified element
function addModelBinding(element, name, bindName) {
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
        } else if (viewModel && viewModel.$imports) {
            model = viewModel;
            imports = viewModel.$imports;
        } else {
            throw new Error('The import binding can only import to Quark components or objects with a propery $imports that contains a Tracker object');
        }

        // Start tracking this dependency
        imports.addDependency(name);

        // Adds the export binding to the element
        addModelBinding(element, name, 'export');
    }
}
ko.virtualElements.allowedBindings.import = true;

ko.bindingHandlers.export = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value;

        // Get's the binded value
        value = ko.unwrap(valueAccessor());

        var model;
        var imports;

        // If the target object has "model" and "imports" properties, then assume that is a quark scope and
        // extract the model and imports object
        if (viewModel && viewModel.imports && viewModel.model) {
            model = viewModel.model;
            imports = viewModel.imports;
        } else if (viewModel && viewModel.$imports) {
            model = viewModel;
            imports = viewModel.$imports;
        } else {
            throw new Error('The import binding can only import to Quark components or objects with a propery $imports that contains a Tracker object');
        }

        var property;

        if ($$.isString(value)) {
            property = value;
        } else {
            throw new Error('The value of the vm value must be an string with the name of the property where quark must load the viewmodel of the nested component');
        }

        if (imports) {
            var childModel = context.$childContext.$data.getModel();
            var childTracker = context.$childContext.$data.getImports();

            imports.loadDependency(property, childModel, childTracker);
        }
    }
}
ko.virtualElements.allowedBindings.export = true;
