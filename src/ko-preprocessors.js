// Node Preproccesors, allows the use of custom tags
ko.bindingProvider.instance.preprocessNode = function(node) {
    // Only react if this is a comment node of the form <!-- quark-component -->
    if (node.nodeType == 8) {

        // Allows component definition open with <!-- quark-component -->
        var match = node.nodeValue.match(/^\s*(quark-component[\s\S]+)/);
        if (match) {
            node.data = " ko component: { name: \'quark-component\' } ";
            return node;
        }

        // Allows component definition close with <!-- /quark-component -->
        var match = node.nodeValue.match(/^\s*(\/quark-component[\s\S]+)/);
        if (match) {
            node.data = " /ko ";

            return node;
        }
    }

    if (node && node.nodeName && ko.components.isRegistered(node.nodeName.toLowerCase())) {
        if (node.attributes['virtual']) {
            var params = node.attributes['params'];
            var bind = node.attributes['data-bind'];
            var modelBind = node.attributes['model-bind'];

            var comment = " ko component: { name: '" + node.nodeName.toLowerCase() + "' ";

            if (params) {
                comment += ", params: { " + params.value + " } ";
            }

            comment += " } ";

            if (bind) {
                comment += ", " + bind.value + " ";
            }

            if (modelBind) {
                comment += ", model-bind: \"" + modelBind.value + "\"";
            }

            var openTag = document.createComment(comment);
            var closeTag = document.createComment(" /ko ");

            node.parentNode.insertBefore(closeTag, node.nextSibling);
            node.parentNode.replaceChild(openTag, node);

            while (node.childNodes.length > 0) {
                openTag.parentNode.insertBefore(node.childNodes[0], closeTag);
            }

            return [openTag, closeTag];
        }
    }
}

// Custom node processor for custom components.
// It allows to use namespaces
ko.components.getComponentNameForNode = function(node) {
    // Get the tag name and transform it to lower case
    var tagNameLower = node.tagName && node.tagName.toLowerCase();

    // If the tag has a component registered as is use the component directly
    if (ko.components.isRegistered(tagNameLower)) {
        // If the element's name exactly matches a preregistered
        // component, use that component
        return tagNameLower;
    } else {
        // If the tag name contains a colon indicating that is using an alias notation
        if (tagNameLower.indexOf(':') !== -1) {
            // Get the tag parts
            var parts = tagNameLower.split(':');

            // Extract the alias and the tag name
            var alias = parts[0];
            var tag = parts[1];

            // Get the context for the node
            var context = ko.contextFor(node);

            // If there's namespaces alias defined in the context and...
            if (context && $$.isObject(context.namespaces)) {
                // If there's a matching alias on the context's list
                if (context.namespaces[alias]) {
                    // Get the namespace and form the component's full name
                    var namespace = context.namespaces[alias];
                    var fullName = namespace + '-' + tag;

                    // If component with the full name is registered then return it
                    if (ko.components.isRegistered(fullName)) {
                        return fullName;
                    }
                }
            }
        }

        // Treat anything else as not representing a component
        return null;
    }
}
