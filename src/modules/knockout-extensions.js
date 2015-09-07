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
