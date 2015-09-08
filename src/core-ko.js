ko.bindingProvider.instance.preprocessNode = function (node) {
    var testAndReplace = function(regExp) {
        var match = node.nodeValue.match(regExp);
        if (match) {
            // Create a pair of comments to replace the single comment
            var c1 = document.createComment("ko " + match[1]),
                c2 = document.createComment("/ko");
            node.parentNode.insertBefore(c1, node);
            node.parentNode.replaceChild(c2, node);

            // Tell Knockout about the new nodes so that it can apply bindings to them
            return [c1, c2];
        } else {
            return false;
        }
    };

    // Only react if this is a comment node of the form <!-- vm: ... -->
    if (node.nodeType === 8) {
        var nodes;
        nodes = testAndReplace(/^\s*(vm\s*:[\s\S]+)/);
        nodes = !nodes ? testAndReplace(/^\s*(call\s*:[\s\S]+)/) : nodes;
        nodes = !nodes ? testAndReplace(/^\s*(inject\s*:[\s\S]+)/) : nodes;

        return nodes;
    }
}

// Calls the specified function when binding the element. The element, viewmodel and context are passed to the function.
ko.bindingHandlers.onBind = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value = ko.unwrap(valueAccessor());
        value(element, viewModel, context);
    }
}

ko.bindingHandlers.vm = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value;
        value = ko.unwrap(valueAccessor());

        var property;

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

        if ($$.isString(property)) {
            if ($$.isDefined(viewModel['childs'])) {
                if ($$.isDefined(viewModel['childs'][property])) {
                    viewModel['childs'][property]['load'](property, context.$child);
                } else {
                    throw 'El objeto especificado no tiene una propiedad de nombre ' + value + '. Verifique que el objeto contenga una propiedad definida con el metodo .components a la que apunta este binding vm.';
                }
            } else {
                throw 'El objeto especificado no tiene la propiedad childs. Esto probablemente se deba a que no uso la funcion .components de quark para definir las propiedades en donde el binding vm debe asignar el viewmodel';
            }
        } else {
            throw 'El valor del binding vm debe ser un string con el nombre de la propiedad del objeto donde se debe cargar el viewmodel del componente anidado';
        }
    }
}
ko.virtualElements.allowedBindings.vm = true;


function callBinding(valueAccessor) {
    var value = ko.unwrap(valueAccessor());
    value();
}

ko.bindingHandlers.call = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        callBinding(valueAccessor);
    },
    update: function (element, valueAccessor, allBindings, viewModel, context) {
        callBinding(valueAccessor);
    }
}
ko.virtualElements.allowedBindings.call = true;


function injectBinding(valueAccessor, viewModel, context) {
    var value = ko.unwrap(valueAccessor());

    var target = context.$child;
    var data = value;

    if ($$.isObject(value)) {
        if ($$.isDefined(value['data']) && $$.isDefined(value['target'])) {
            target = value.target;
            data = value.data;
        }
    }

    $$.inject(data, target);
}

ko.bindingHandlers.inject = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        injectBinding(valueAccessor, viewModel, context);
    },
    update: function (element, valueAccessor, allBindings, viewModel, context) {
        injectBinding(valueAccessor, viewModel, context);
    }
};
ko.virtualElements.allowedBindings.inject = true;

function createComponentShadyDomAccesor(context) {
    var newAccesor = function () {
        return { nodes: context.$componentTemplateNodes };
    };

    return newAccesor;
}

ko.bindingHandlers.componentShadyDom = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createComponentShadyDomAccesor(context);
        return ko.bindingHandlers.template.init(element, newAccesor, allBindingsAccessor, context.$parent, context.$parentContext);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createComponentShadyDomAccesor(context);
        return ko.bindingHandlers.template.update(element, newAccesor, allBindingsAccessor, context.$parent, context.$parentContext);
    }
};
ko.virtualElements.allowedBindings.componentShadyDom = true;


function createModelExporterAccessor(element, valueAccessor, allBindingsAccessor, viewModel, context) {
    var newAccesor = function () {
        var nodes = Array();

        for (var i = 0; i < context.$parentContext.$componentTemplateNodes.length; i++) {
            var node = context.$parentContext.$componentTemplateNodes[i];
            if (node.nodeType === 8) {
                var match = node.nodeValue.indexOf("vm:") > -1;
                if (match) {
                    nodes.push(node);
                }
                match = node.nodeValue.indexOf("call:") > -1;
                if (match) {
                    nodes.push(node);
                }
                match = node.nodeValue.indexOf("inject:") > -1;
                if (match) {
                    nodes.push(node);
                }
            }
        }

        return { nodes: nodes, if: nodes.length > 0 };
    };

    return newAccesor;
}

ko.bindingHandlers.modelExporter = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createModelExporterAccessor(element, valueAccessor, allBindingsAccessor, viewModel, context);
        var newContext = context.$parentContext.$parentContext.extend({ $child: context.$parent, $childContext: context });
        return ko.bindingHandlers.template.init(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createModelExporterAccessor(element, valueAccessor, allBindingsAccessor, viewModel, context);
        var newContext = context.$parentContext.$parentContext.extend({ $child: context.$parent, $childContext: context });
        return ko.bindingHandlers.template.update(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
    }
};
ko.virtualElements.allowedBindings.modelExporter = true;

function createContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context) {
    var value = ko.unwrap(valueAccessor());
    var newAccesor = function () {
        if (!$$.isInt(value)) {
            return { nodes: $(context.$componentTemplateNodes).filter(value) };
        } else {
            return { nodes: context.$componentTemplateNodes.slice(value) };
        }
    };
    return newAccesor;
}

ko.bindingHandlers.content = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context);
        var newContext = context.$parentContext.extend({ $child: viewModel, $childContext: context });
        return ko.bindingHandlers.template.init(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context);
        var newContext = context.$parentContext.extend({ $child: viewModel, $childContext: context });
        return ko.bindingHandlers.template.update(element, newAccesor, allBindingsAccessor, context.$parent, newContext);
    }
};

ko.virtualElements.allowedBindings.content = true;

function createHasContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context) {
    var value = ko.unwrap(valueAccessor());

    var newAccesor = function () {
        return $(context.$componentTemplateNodes).filter(value).length > 0;
    };

    return newAccesor;
}

ko.bindingHandlers.hasContent = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createHasContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context);
        // If va asi por el IE8
        return ko.bindingHandlers['if'].init(element, newAccesor, allBindingsAccessor, context, context);
    }
};
ko.virtualElements.allowedBindings.hasContent = true;

ko.bindingHandlers.hasNotContent = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createHasContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context);
        // If va asi por el IE8
        return ko.bindingHandlers['ifnot'].init(element, newAccesor, allBindingsAccessor, context, context);
    }
};
ko.virtualElements.allowedBindings.hasNotContent = true;
