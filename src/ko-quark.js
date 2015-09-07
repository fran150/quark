/**
 * @function
 *
 * @description Binding que carga en las propiedad declaradas como componentes
 * el viewmodel del elemento en donde se utiliza. Sirve para obtener en el objeto
 * padre el viewmodel de los componentes hijos y se llama especificando el nombre
 * de la propiedad declarada dentro de .components como un string.
 *
 * Si se necesita llamar desde un elemento que se encuentra en el contenido de un
 * componente se puede invocar especificando un objeto con el formato
 * { property: 'Nombre de la propiedad', model: Referencia al componente padre }
 *
 * @example
 * <!-- Se debe invocar desde el contenido de un componente knockout, y puede usarse como
 * data-bind o como elemento virtual por ejemplo: -->
 *  <componente-knockout>
 *      <!-- ko vm: 'componenteKnockoutVm' --><!-- /ko -->
 *  </componente-knockout>
 *
 *  <!-- La propiedad componenteKnockoutVm debe existir en el objeto padre -->
 *
 *  <!-- Otro ejemplo sería: --!>
 *
 *  <otro-componente>
 *      <componente-knockout>
 *          <!-- ko vm: { property: 'componenteKnockoutVm', model: $parent } --><!-- /ko -->
 *      </componente-knockout>
 *  </otro-componente>
 *
 *  <!-- En este caso el viewmodel de componente-knockout se asignara a la propiedad del componente
 *  padre -->

 *
 * @memberOf Extensiones Knockout.Bindings
 */
ko.bindingHandlers.vm = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value;
        value = ko.unwrap(valueAccessor());

        var property;

        if (!quark.isString(value)) {
            if (quark.isObject(value)) {
                if (quark.isString(value['property'])) {
                    property = value['property'];
                }

                if (quark.isDefined(value['model'])) {
                    viewModel = value['model'];
                }
            }
        } else {
            property = value;
        }

        if (quark.isString(property)) {
            if (quark.isDefined(viewModel['childs'])) {
                if (quark.isDefined(viewModel['childs'][property])) {
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
};
ko.virtualElements.allowedBindings.vm = true;


function callBinding(valueAccessor) {
    var value = ko.unwrap(valueAccessor());
    value();
};

ko.bindingHandlers.call = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        callBinding(valueAccessor);
    },
    update: function (element, valueAccessor, allBindings, viewModel, context) {
        callBinding(valueAccessor);
    }
};
ko.virtualElements.allowedBindings.call = true;


function injectBinding(valueAccessor, viewModel, context) {
    var value = ko.unwrap(valueAccessor());

    var target = context.$child;
    var data = value;

    if (quark.isObject(value)) {
        if (quark.isDefined(value['data']) && quark.isDefined(value['target'])) {
            target = value.target;
            data = value.data;
        }
    }

    quark.inject(data, target);
}
/**
 * @function
 *
 * @description Binding que permite especificar como parametros un elemento cuyo
 * contenido se debe injectar en el componente especificado.
 * Se puede invocar especificando el elemento de datos exclusivamente y en tal caso
 * se injectará en el componente que lo invoca o se puede especificar un objeto con la forma
 * { data: objeto con los datos, target: objeto o componente donde se deben injectar los valores }
 *
 * @memberOf Extensiones Knockout.Bindings
 */
ko.bindingHandlers.inject = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        injectBinding(valueAccessor, viewModel, context);
    },
    update: function (element, valueAccessor, allBindings, viewModel, context) {
        injectBinding(valueAccessor, viewModel, context);
    }
};
ko.virtualElements.allowedBindings.inject = true;

/**
 * @function
 *
 * @description Directiva del preprocesador de knockout que permite utilizar el binding
 * vm, el binding call y el binding inject en una forma abreviada del tipo:
 *
 * @example
 * <componente-knockout>
 *  <!-- vm: propiedadDelPadre -->
 * </componente-knockout>
 *
 * <componente-knockout>
 *  <!-- call: esUnaFuncion -->
 * </componente-knockout>
 *
 * <componente-knockout>
 *  <!-- inject: data -->
 * </componente-knockout>
 *
 * @param {object} node Nodo que se va a procesar
 *
 * @memberOf Extensiones Knockout.Bindings
 */
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
};

/**
 * @function
 * @description Genera un nuevo accessor de knockout utilizando los nodos del contenido del componente.
 * Se usa dentro del binding componentShadyDom.
 * @param {context} context Contexto del componente
 * @returns {accessor} Nuevo accessor con los nodos del contenido del componente
 */
function createComponentShadyDomAccesor(context) {
    var newAccesor = function () {
        return { nodes: context.$componentTemplateNodes };
    };

    return newAccesor;
}

/**
 * @function
 *
 * @description Binding usado por el componente generico (de nombre "componente") para mostrar
 * su contenido sin agregar un nuevo nivel de contextos en el arbol.
 * <br/>
 * Es una extension del template que invoca a la generacion del mismo con el contenido del
 * tag componente y con el contexto del padre, lo que hace que la existencia del elemento
 * componente sea transparente para el programador.
 * <br/>
 * Es utilizado internamente por el componente generico y no deberia, en principio, ser utilizado
 * fuera de este.
 *
 * @memberOf Extensiones Knockout.Bindings.Componente Generico
 */
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

/**
 * @function
 *
 * @description Binding usado por el componente generico (de nombre "componente"). Este binding
 * busca cualquier tag con el binding vm y lo envia al navegador creando un contexto especial
 * al nivel del padre y con un objeto interno llamado $child con el view model del componente hijo.
 * <br />
 * Este contexto es el utilizado por el binding vm para hallar en el padre la funcion
 * a la que debe enviar el objeto hijo recibido en la propiedad $child de dicho contexto.
 * <br/>
 * Es utilizado internamente por el componente generico y no deberia, en principio, ser utilizado
 * fuera de este.
 *
 * @memberOf Extensiones Knockout.Bindings.Componente Generico
 */
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
        if (!quark.isInt(value)) {
            return { nodes: $(context.$componentTemplateNodes).filter(value) };
        } else {
            return { nodes: context.$componentTemplateNodes.slice(value) };
        }
    };
    return newAccesor;
}
/**
 * @function
 *
 * @description Binding que permite indicar donde se debe mostrar el contenido que se especifico
 * en el tag padre dentro del componente. Su utilidad es cuando se desarrolla un componente
 * que a su vez puede contener otros.
 * <br />
 * Este binding permite especificar un selector JQuery con el contenido especificado en el tag
 * que se debe mostrar dentro del componente, o sea, hace las veces de placeholder para dicho
 * contenido.
 *
 * @example
 * <!-- La forma mas facil de entenderlo es con un ejemplo. Por ejemplo un componente llamado nota,
 * puede tener el siguiente HTML: -->
 * <componente>
 * <h1>
 *  <!-- ko content: '.titulo' --><!-- /ko -->
 * </h1>
 * <p><!-- ko content: '.cuerpo' --><!-- /ko --></p>
 * </componente>
 *
 * <!-- Luego al utilizarse se puede usar de la siguiente forma: -->
 *  <nota>
 *      <div class="titulo">Este es el titulo</div>
 *      <div class="cuerpo">Este es el cuerpo</div>
 *  </nota>
 *
 * <!-- De esta forma en el titulo h1 se mostrara "Este es el titulo" y en el
 * parrafo inferior ira el texto "Este es el cuerpo" -->
 *
 * @memberOf Extensiones Knockout.Bindings
 */
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
/**
 * @function
 *
 * @description Binding que permite especificar un bloque que solo se debe mostrar si en el
 * contenido del componente se ha especificado algun contenido que cumpla con el selector especificado.
 * <br />
 * @example
 * <!-- La forma mas facil de entenderlo es con un ejemplo. Por ejemplo un componente llamado nota,
 * puede tener el siguiente HTML: -->
 * <componente>
 * <!-- ko hasContent: '.titulo' -->
 *  El titulo es:
 *  <h1>
 *   <!-- ko content: '.titulo' --><!-- /ko -->
 *  </h1>
 * <!-- /ko -->
 * <p><!-- ko content: '.cuerpo' --><!-- /ko --></p>
 * </componente>
 *
 * <!-- Luego al utilizarse se puede usar de la siguiente forma: -->
 *  <nota>
 *      <div class="cuerpo">Este es el cuerpo</div>
 *  </nota>
 *
 * <!-- De esta forma el mensaje "El titulo es:" no se mostrara ya que no se ha
 * especificado ningun contenido con clase "titulo" -->
 *
 * @memberOf Extensiones Knockout.Bindings
 */
ko.bindingHandlers.hasContent = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createHasContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context);
        // If va asi por el IE8
        return ko.bindingHandlers['if'].init(element, newAccesor, allBindingsAccessor, context, context);
    }
};
ko.virtualElements.allowedBindings.hasContent = true;

/**
 * @function
 *
 * @description Binding que permite especificar un bloque que solo se debe mostrar si en el
 * contenido del componente NO se ha especificado algun contenido que cumpla con el selector especificado.
 * <br />
 * @example
 * <!-- La forma mas facil de entenderlo es con un ejemplo. Por ejemplo un componente llamado nota,
 * puede tener el siguiente HTML: -->
 * <componente>
 * <!-- ko hasNotContent: '.tituloCustom' -->
 *  El titulo es:
 *  <h1>
 *   Titulo generico
 *  </h1>
 * <!-- /ko -->
 * <p><!-- ko content: '.cuerpo' --><!-- /ko --></p>
 * </componente>
 *
 * <!-- Luego si se usa de la siguiente forma: -->
 *  <nota>
 *      <div class="cuerpo">Este es el cuerpo</div>
 *  </nota>
 *
 * <!-- Se mostrara el mensaje "El titulo es: Titulo Generico" ya que no se ha
 * especificado ningun contenido con clase "tituloCustom" -->
 *
 * @memberOf Extensiones Knockout.Bindings
 */
ko.bindingHandlers.hasNotContent = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var newAccesor = createHasContentAccesor(element, valueAccessor, allBindingsAccessor, viewModel, context);
        // If va asi por el IE8
        return ko.bindingHandlers['ifnot'].init(element, newAccesor, allBindingsAccessor, context, context);
    }
};
ko.virtualElements.allowedBindings.hasNotContent = true;
