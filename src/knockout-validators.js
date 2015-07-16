/**
 * @function
 * 
 * @memberOf Extensiones Knockout.Validacion.Validadores
 * 
 * @description Valida que el observable tenga algun valor
 * <pre>
 *  Formato Configuracion:
 *  {
 *      message: Mensaje a mostrar, si no se especifica se mostrara el mensaje "El campo X es obligatorio"
 *  }
 *  
 *  @param {observable} observable Observable a validar
 *  @param {object} config Objeto con la configuracion de validacion
 * </pre>
 */
ko.validators.required = function (observable, config) {
    var self = this;

    // Funcion de validacion
    this.validate = function (newValue) {
        observable.validationReset();

        // Si no tiene un valor valido genera el error
        if (!newValue) {
            observable.hasError(true);
            observable.validationMessage((config['message'] || 'El campo {0} es obligatorio').replace('{0}', observable.validatable));

            return false;
        }

        return true;
    };

    return this;
};

/**
 * @function
 * 
 * @memberOf Extensiones Knockout.Validacion.Validadores
 * 
 * @description Valida que el observable tenga el largo de caracteres minimo y maximo especificados
 * <pre>
 *  Formato Configuracion:
 *  {
 *      message: Mensaje a mostrar, si no se especifica se mostrara el mensaje "El campo X debe tener al menos MIN caracteres" o "El campo X debe tener como maximo MAX caracteres",
 *      min: Numero minimo de caracteres que debe tener la cadena, no especificar si no se quiere validar un minimo de caracteres,
 *      max: Numero maximo de caracteres que debe tener la cadena, no especificar si no se quiere validar un maximo de caracteres,
 *  }
 * </pre>
 * 
 * @param {observable} observable Observable a validar
 * @param {object} config Objeto con la configuracion de validacion
 */
ko.validators.length = function (observable, config) {
    var self = this;

    this.validate = function (newValue) {
        observable.validationReset();

        var length = 0;

        // Si tiene un valor valido obtengo el largo del campo
        if (newValue) length = newValue.length;

        // Si se configuro un minimo y el largo es menor da error
        if (config['min'] && length < config.min) {
            observable.hasError(true);
            observable.validationMessage((config['message'] || 'El campo {0} debe tener al menos {1} caracteres')
                .replace('{0}', observable.validatable)
                .replace('{1}', config.min)
                .replace('{2}', config.max)
            );

            return false;
        }

        // Si se configuro un maximo y el largo es mayor da error
        if (config['max'] && length > config.max) {
            observable.hasError(true);
            observable.validationMessage((config['message'] || 'El campo {0} debe tener como maximo {2} caracteres')
                .replace('{0}', observable.validatable)
                .replace('{1}', config.min)
                .replace('{2}', config.max)
            );

            return false;
        }

        return true;
    };

    return this;
};

/**
 * @function
 * 
 * @memberOf Extensiones Knockout.Validacion.Validadores
 * 
 * @description Valida que el observable sea un numero valido
 * <pre>
 *  Formato Configuracion:
 *  {
 *      message: Mensaje a mostrar, si no se especifica se mostrara el mensaje "El campo X debe ser un numero valido"
 *  }
 * </pre>
 *
 * @param {observable} observable Observable a validar
 * @param {object} config Objeto con la configuracion de validacion
 */
ko.validators.numero = function (observable, config) {
    var self = this;

    this.validate = function (newValue) {
        observable.validationReset();

        // Si no es un numero valido da error
        if (newValue !== '' && isNaN(newValue)) {
            observable.hasError(true);
            observable.validationMessage((config['message'] || 'El campo {0} debe ser un numero valido')
                .replace('{0}', observable.validatable)
            );

            return false;
        }

        return true;
    };

    return this;
};

/**
 * @function
 * 
 * @memberOf Extensiones Knockout.Validacion.Validadores
 * 
 * @description Valida que el observable sea un numero valido
 * <pre>
 *  Formato Configuracion:
 *  {
 *      message: Mensaje a mostrar, si no se especifica se mostrara el mensaje "El campo X debe ser un numero entero valido"
 *  }
 * </pre>
 * 
 * @param {observable} observable Observable a validar
 * @param {object} config Objeto con la configuracion de validacion
 */
ko.validators.entero = function (observable, config) {
    var self = this;

    this.validate = function (newValue) {
        observable.validationReset();

        // Si no es un numero valido da error
        if (newValue !== '' && quark.isInt(newValue)) {
            observable.hasError(true);
            observable.validationMessage((config['message'] || 'El campo {0} debe ser un numero entero valido')
                .replace('{0}', observable.validatable)
            );

            return false;
        }

        return true;
    };

    return this;
};

/**
 * @function
 * 
 * @memberOf Extensiones Knockout.Validacion.Validadores
 * 
 * @description Valida que el observable sea una fecha valida
 * <pre>
 *  Formato Configuracion:
 *  {
 *      message: Mensaje a mostrar, si no se especifica se mostrara el mensaje "El campo X debe ser una fecha valida"
 *  }
 * </pre>
 * 
 * @param {observable} observable Observable a validar
 * @param {object} config Objeto con la configuracion de validacion
 */
ko.validators.fecha = function (observable, config) {
    var self = this;

    this.validate = function (newValue) {
        observable.validationReset();

        var pattern = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/;

        // Si no es una fecha valida da error
        if (newValue !== '' && !pattern.test(newValue)) {
            observable.hasError(true);
            observable.validationMessage((config['message'] || 'El campo {0} debe ser una fecha valida')
                .replace('{0}', observable.validatable)
            );

            return false;
        }

        return true;
    };

    return this;
};