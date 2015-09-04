var quark = new $$();
ko.mapping = komapping;
/**
 * Extension de knockout para permitir validar objetos y mostrar los errores de validacion en el formulario
 * 
 * @namespace Extensiones Knockout.Validacion
 */

/**
 * Extensiones de observables para permitir la validacion de objetos
 * 
 * @namespace Extensiones Knockout.Validacion.Observables
 */

/**
 * Bindings customizados de knockout
 * 
 * @namespace Extensiones Knockout.Bindings
 */

/**
 * Bindings customizados de knockout usados exclusivamente en el funcionamiento del objeto generico "Componente"
 * 
 * @namespace Extensiones Knockout.Bindings.Componente Generico
 */

/**
 * @property {array} validators Listado de validadores configurados. Son objetos del tipo function(observable, config) y dentro deben poseer un metodo
 * validate(newValue). La propiedad observable del constructor es el observable que se debe validar, el campo config es un array de valores
 * para configurar el validador. El metodo validate se invoca para validar el valor del observable pasandole el nuevo valor
 * del mismo en el parametro newValue.
 * 
 * La funcion validate deberia como primer paso resetear el valor de error del observable con el fin de eliminar algun error
 * anterior, esto puede hacerse invocando la funcion validationReset del observable. Luego debe evaluar el nuevo valor y en base 
 * a la configuracion decidir si el nuevo valor es valido. En caso de serlo debe devolver true, en caso contrario debe devolver falso 
 * pudiendo previamente setear el valor en las propiedades (que son observables) hasError y validationMessage del observable que se esta 
 * validando para indicar que se produjo un error en la primera y el mensaje de error en la segunda.
 * 
 * @public 
 * 
 * @memberOf Knockout Extensions.Validacion
 */
ko.validators = {};

/**
 * @function
 *
 * @description Valida el objeto especificado. Recorre las propiedades del objeto ejecutando las validaciones configuradas
 * en cada observable.
 * 
 * Permite subscribir la validacion al observable de manera que se ejecute cada vez que el valor cambia.
 * 
 * @param {object} object - Objeto a validar
 * @param {bool} subscribe - Indica si se debe subscribir el validador al observable de manera que se ejecute cada vez que 
 * el mismo se modifica
 * 
 * @memberOf Extensiones Knockout.Validacion
 * 
 * @returns {bool} Verdadero si el objeto es valido
 */
ko.validate = function (object, subscribe) {
    var result = true;

    // Recorre las propiedades del objeto
    for (var propertyName in object) {
        // Obtiene la propiedad
        var property = object[propertyName];

        // Si es un observable y tiene validaciones configuradas
        if (ko.isObservable(property)) {
            if (property['validatable']) {
                // Valida el observable pasandole si debe subscribir
                if (!property.validate(subscribe)) {
                    result = false;
                }
            }
        }
    }

    return result;
};

/**
 * @function
 *
 * @description Resetea las validaciones del objeto especificado. Recorre las propiedades del objeto reseteando las validaciones
 * en cada observable.
 * 
 * @memberOf Extensiones Knockout.Validacion
 * 
 * @param {object} object - Objeto cuyas validaciones se deben resetear
 */
ko.validationReset = function (object) {
    // Recorre todas las propiedades del objeto
    for (var propertyName in object) {
        // Obtiene la propiedad
        var property = object[propertyName];

        // Si es un observable y tiene las validaciones configuradas
        if (ko.isObservable(property)) {
            if (property['validatable']) {
                // Resetea los errores de validacion del observable
                property.validationReset();
            }
        }
    }
};

/**
 * @function
 * 
 * @memberOf ko.observable.fn
 *
 * @description Extiende los observables agregando la posibilidad de configurar las validaciones que se deben aplicar al mismo
 * 
 * @param {string} name - Nombre del campo a mostrar en los mensajes de alertas. Debe ser un nombre entendible por el usuario.
 * @param {object} validationConfig - Objeto con una propiedad con el nombre de cada validadador que se desea ejecutar en el
 * observable, cada propiedad debe contener la configuracion de validacion de dicho validador. 
 * el mismo se modifica
 * @param {object} parent - Debe especificar el objeto padre (dueno) de los observables para que no haya inconvenientes con el
 * scope de los validadores.
 * 
 * @memberOf Extensiones Knockout.Validacion.Observables
 * 
 * @returns {observable} - Devuelve el propio validador para poder encadenar las llamadas entre si
 */
ko.observable.fn.validation = function (name, validationConfig, parent) {
    // Indica que el campo es validable, y el nombre con el cual debe aparecer en los mensajes
    this.validatable = name;

    // Carga la configuracion de validacion
    this.validationConfig = {};
    this.validationConfig = validationConfig;

    // Extiende el observable con observables que indican si el observable tiene error
    // y el mensaje
    this.hasError = ko.observable();
    this.validationMessage = ko.observable();

    // Si se especifico un objeto padre crea una propiedad para guardarlo
    if (parent) {
        this.parent = parent;

        // Si el objeto padre no tiene un sumario de validaciones crea uno que es un 
        // array observable que un elemento por cada error de validacion
        if (!parent['validationSummary']) {
            parent.validationSummary = ko.observableArray();
        }
    }

    // Devuelve el propio observable, permitiendo encadenar la llamada en la misma llamada a ko.observable
    return this;
};

 /**
 * @function
 *
 * @description Extiende los observables agregando una funcion que permite limpiar los erroers de validacion.
 * 
 * @memberOf Extensiones Knockout.Validacion.Observables
 * 
 */
ko.observable.fn.validationReset = function () {
    var me = this;
    // Si se configuraron validaciones sobre este observable
    if (this['validatable']) {
        // Saca el flag de error y limpia el mensaje
        this.hasError(false);
        this.validationMessage('');

        // Si ademas se definio el objeto padre elimina el error del sumario de errores
        if (this['parent']) {
            this.parent.validationSummary.remove(function (item) {
                return item.name === me.validatable;
            });
        }
    }
};

/**
 * @function
 *
 * @description Extiende los observables agregando una funcion que valida si el valor que se le pasa es valido o no
 * 
 * @param {var} newValue - Nuevo valor del observable a validar
 * 
 * @deprecated Esta funcion en realidad es llamada por la funcion validate del observable para validar el nuevo valor
 * del observable y poder subscribir esta funcion al observable para revalidar cada vez que cambie el valor del mismo.
 * Antes de la puesta en produccion habria que integrar estas funcionalidades ya que esta funcion no se debe invocar 
 * directamente por el usuario por lo que deberia desaparecer.
 * 
 * @memberOf Extensiones Knockout.Validacion.Observables
 * 
 * @returns {bool} - Verdadero si el valor de la variable es valido
 */
ko.observable.fn.validateValue = function (newValue) {
    // Resetea las validaciones del observable
    this.validationReset();

    // Recorro las configuraciones de validacion del observable
    for (var name in this.validationConfig) {
        // Obtengo la configuracion del validador
        var config = this.validationConfig[name];

        // Si hay un validador configurado con el nombre especificado
        if (ko.validators[name]) {
            // Obtengo el validador ;) pasandole el observable y la configuracion
            var validator = ko.validators[name](this, config);

            // Valido utilizando el valor obtenido y el valor pasado a la funcion
            if (!validator.validate(newValue)) {
                // Si se produjo un error de validacion lo cargo en el summary
                if (this['parent']) {
                    this.parent.validationSummary.push({ name: this.validatable, message: this.validationMessage() });
                }
                return false;
            }
        }
    }

    return true;
};

/**
 * @function
 *
 * @description Extiende los observables agregando una funcion que valida el observable indicando ademas si se debe 
 * subscribir los objetos a la validacion de forma que la misma se realice automaticamente al variar el contenido del mismo
 * 
 * @param {bool} subscribe - Indica si se debe subscribir la validacion al valor del observable
 * 
 * @memberOf Extensiones Knockout.Validacion.Observables
 * 
 * @returns {bool} - Verdadero si el valor de la variable es valido
 */
ko.observable.fn.validate = function (subscribe) {
    // Si se debe subscribir y no hay una subscripcion previa
    if (subscribe && !this['subscription']) {
        this.subscription = this.subscribe(this.validateValue, this);
    }

    return this.validateValue(this());
};

/**
 * @function
 * 
 * @description Devuelve verdadero si el elemento es un observable array
 * 
 * @param {object} elem Elemento que se debe verificar si es un observable array
 * 
 * @memberOf Extensiones Knockout
 * 
 * @returns {bool} Verdadero si el elemento es un observableArray
 */
ko.isObservableArray = function(elem) {
    if (ko.isObservable(elem) && elem.indexOf !== undefined) {
        return true;
    }
    
    return false;
};

/**
 * @function
 *
 * @description Devuelve verdadero si el elemento es un computed observable
 *
 * @param {object} instance Elemento que se debe verificar si es un computed observable
 *
 * @memberOf Extensiones Knockout
 *
 * @returns {bool} Verdadero si el elemento es un computed observable
 */
ko.isComputed = function (instance) {
    if ((instance === null) || (instance === undefined) || (instance.__ko_proto__ === undefined)) return false;
    if (instance.__ko_proto__ === ko.dependentObservable) return true;
    return ko.isComputed(instance.__ko_proto__); // Walk the prototype chain
};


/**
 * @function
 *
 * @description Transforma un objeto (ya sea un objeto plano o un objeto observable) en un string JSON
 * 
 * @param {object} model - Objeto a transformar en JSON
 * 
 * @memberOf Extensiones Knockout
 * 
 * @returns {string} - JSON que representa al objeto pasado por parametro
 */
ko.getJson = function (model) {
    var unmapped = komapping.toJS(model);

    for (var i in unmapped) {
        if (unmapped[i] === null || unmapped[i] === undefined) {
            delete unmapped[i];
        }
        else if (typeof unmapped[i] === "object") {
            ko.getJson(unmapped[i]);
        }
    }

    var result = komapping.toJSON(unmapped);

    result = result.replace(/\/Date\(\d+\)/g, function (a) { return '\\' + a + '\\'; });

    return result;
};

/**
* @function
*
* @description Crea un observable computado a partir de un parametro con el fin de cambiar el valor al leer o modificar el parametro.
* Es util cuando se desea modificar el tipo de dato que llega como parametro dentro del componente, o para atachar eventos o comportamiento
* cuando se modifca el valor.
* El primer parametro es el parametro del componente con el que se desea trabajar, si el parametro no es un observable lo transforma en uno.
* El segundo parametro es un objeto con la forma { read: function(param), write: function(param, value) } con las funciones de lectura
* y escritura del campo. El param es la version observable del parametro el resto se comporta igual que el computed standard de knockout.
* El tercer parametro es similar al de los observables de knockout y sirve para definir el valor del this.
*
* @param {param} Parametro con el que se desea trabajar
* @param {accessors} Objeto con la forma { read: function(param), write: function(param, value) } con las funciones de lectura
* y escritura del campo
* @param {object} Objeto para definir el valor de this
*
* @returns Un computedObservable con las funciones accessor
*/
ko.computedParameter = function (param, accessors, object) {
    if (!ko.isObservable(param)) {
        param = ko.observable(param);
    }

    return ko.computed({
        read: function () {
            return accessors.read(param);
        },
        write: function (newValue) {
            return accessors.write(param, newValue);
        }
    }, object);
}

/**
 * @function
 *
 * @description Binding que permite invocar una funcion cuando el objeto se bindea contra knockout. La funcion debe ser
 * del tipo function(element, viewModel, context). El parametro element contiene el elemento del DOM desde donde se 
 * invoca la funcion, el parametro viewModel contiene el modelo contra el que se bindea dicho elemento y finalmente
 * el parametro context contiene el contexto del binding ($parent, $parents, $root, etc)
 * 
 * @memberOf Extensiones Knockout.Bindings
 */
ko.bindingHandlers.onBind = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        var value = ko.unwrap(valueAccessor());
        value(element, viewModel, context);
    }
};

/**
 * Codigo del binding formGroupError que asigna el estilo has-error al elemento
 * si el observable seleccionado contiene error de validacion.
 * 
 * @param {type} element Elemento desde donde invoca
 * @param {type} valueAccessor Accessor de knockout
 * @param {type} allBindings Otros bindings en el mismo elemento
 * @param {type} viewModel ViewModel al que se bindea
 * @param {type} context Contexto del binding
 */
function setFormGroupErrorClass(element, valueAccessor, allBindings, viewModel, context) {
    var value = valueAccessor();
    var hasError = false;

    if (quark.isArray(value)) {
        for (var i = 0; i < value.length; i++) {
            if (!value[i].hasError()) {
                hasError = true;
            }
        }
    } else {
        hasError = value.hasError();
    }

    if (hasError) {
        $(element).addClass('has-error');
    } else {
        $(element).removeClass('has-error');
    }    
}

/**
 * @function
 *
 * @description Binding que permite especificar un observable y si el mismo tiene una validacion con error le agrega la clase
 * "has-error" de bootstrpa al tag desde donde se invoca.
 * Esto sirve para setearle esta clase a los form-group permitiendo que se marquen en rojo tanto el label como el campo con error
 * 
 * @memberOf Extensiones Knockout.Bindings
 */
ko.bindingHandlers.formGroupError = {
    init: function (element, valueAccessor, allBindings, viewModel, context) {
        setFormGroupErrorClass(element, valueAccessor, allBindings, viewModel, context);
    },
    update: function (element, valueAccessor, allBindings, viewModel, context) {
        setFormGroupErrorClass(element, valueAccessor, allBindings, viewModel, context);
    }
};

/**
 * @function
 *
 * @description Binding que permite especificar una condicion y en caso de cumplirse aplica al elemento desde donde se invoca
 * el estilo "success" de bootstrap.
 * Esto permite especificarlo en cada fila de una tabla, comparando el valor de una variable con el correspondiente a la clave
 * primaria del registro que la fila representa con el objetivo de pintarla como seleccionada...
 * 
 * @example
 * <div data-bind="rowSelect: id == $parent.idSeleccionado">
 * 
 * @memberOf Extensiones Knockout.Bindings
 */
ko.bindingHandlers.rowSelect = {
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var options = ko.unwrap(valueAccessor());

        var selectedValueAccessor = function () {
            return { success: options.isSelected(viewModel) };
        };

        ko.bindingHandlers.css.update(element, selectedValueAccessor, allBindingsAccessor, viewModel, context);

        var clickValueAccessor = function () {
            return options.select;
        };

        ko.bindingHandlers.click.init(element, clickValueAccessor, allBindingsAccessor, viewModel, context);
    }
};

/**
 * @function
 *
 * @description Binding que permite el ingreso de numeros decimales formateados con separadores de miles . y de decimales ,
 * asignandolos a la propiedad value del objeto.
 * 
 * @memberOf Extensiones Knockout.Bindings
 */
ko.bindingHandlers.numericValue = {
    init: function (element, valueAccessor) {
        var underlyingObservable = valueAccessor();

        var interceptor = ko.pureComputed({
            read: function () {
                if (quark.isDefined(underlyingObservable())) {
                    return accounting.formatNumber(underlyingObservable(), 2, ".", ",");
                } else {
                    return undefined;
                }
            },

            write: function (newValue) {
                var current = underlyingObservable();
                var valueToWrite = accounting.unformat(newValue, ",");

                if (isNaN(valueToWrite)) {
                    valueToWrite = newValue;
                }

                if (valueToWrite !== current) {
                    underlyingObservable(accounting.toFixed(valueToWrite, 2));
                } else {
                    if (newValue !== current.toString())
                        underlyingObservable.valueHasMutated();
                }
            }
        });

        ko.applyBindingsToNode(element, { value: interceptor });
    }
};

ko.bindingHandlers.moneyValue = {
    init: function (element, valueAccessor) {
        var underlyingObservable = valueAccessor();

        var interceptor = ko.pureComputed({
            read: function () {
                return accounting.formatMoney(underlyingObservable(),"$ ", 2, ".", ",");
            },

            write: function (newValue) {
                var current = underlyingObservable();
                var valueToWrite = accounting.unformat(newValue, ",");

                if (isNaN(valueToWrite)) {
                    valueToWrite = newValue;
                }

                if (valueToWrite !== current) {
                    underlyingObservable(accounting.toFixed(valueToWrite, 2));
                } else {
                    if (newValue !== current.toString())
                        underlyingObservable.valueHasMutated();
                }
            }
        });

        ko.applyBindingsToNode(element, { value: interceptor });
    }
};

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
