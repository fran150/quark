/**
 * Libreria para desarrollo de aplicaciones web basados en componentes knockout
 * 
 * @namespace Quark
 */


/**
* @constructor 
* @memberOf Quark
* @public
*/
function $$() {
    /**
    * @public
    * @property {object} self - Se asigna el propio objeto para mantener el scope evitando problemas con la variable this
    */
    var self = this;

    /**
    * @property {array} clientErrorHandlers - Manejadores de errores de cliente. Debe cargarse con funciones con la forma
    * function (target, jqXHR, textStatus, errorThrown). El primer parametro es el servicio que se estaba invocando cuando
    * se produjo el error, el resto son los mismos generados por el comando $.ajax de jquery.
    * Al producirse un error se recorre el array en el orden que se cargo, cada funcion debe intentar resolver la excepcion
    * y en caso de lograrlo devolver true para indicar que se manejo el error.
    */
    this.clientErrorHandlers = {};
    /**
    * @property {array} serverErrorHandlers - Manejadores de errores del servidor. Debe cargarse con funciones con la forma
    * function (target, errorData). El primer parametro es el servicio que se estaba invocando cuando se produjo el error,
    * el otro es el objeto recibido desde el servicio con los datos del error que se produjo en el servidor.
    * Al producirse un error se recorre el array en el orden que se cargo, cada funcion debe intentar resolver la excepcion
    * y en caso de lograrlo devolver true para indicar que se manejo el error.
    */
    this.serverErrorHandlers = {};

    /**
     * @function
     * 
     * @description Devuelve verdadero si la variable esta definida.
     * 
     * @param {var} variable - Variable que se debe verificar si esta definida.
     * 
     * @returns Verdadero si la variable esta definida.
     */
    this.isDefined = function (variable) {
        if (typeof variable === 'undefined') {
            return false;
        };

        return true;
    };

    /**
     * @function
     * 
     * @description Redirige el navegador a la url especificada.
     * 
     * @param {string} url Url a la que se quiere redirigir el navegador
     */
    this.redirect = function (url) {
        window.location.href = url;
        return true;
    };

    /**
     * @function
     * 
     * @description Devuelve una copia del objeto especificado. Si se desea clonar un objeto cuyas propiedades son observables
     * utilizar la funcion cloneObservable.
     * 
     * @see {@link bpba-utils:utils#cloneObservable}
     * 
     * @param {object} obj - Objeto que se desea clonar.
     * 
     * @return {object} - Devuelve una copia del objeto especificado.
     */
    this.clone = function (obj) {
        return jQuery.extend(true, {}, obj);
    };

    /**
     * @function
     * 
     * @description Devuelve una copia del objeto observable especificado. Se entiende por objeto observable aquel en que 
     * todas sus propiedades son observables. Se puede transformar un objeto de JS en observable usando la funcion de knockout
     * ko.mapping.fromJS. Si se desea clonar un objeto que no es observable utilizar la funcion clone.
     * 
     * @see {@link bpba-utils:utils#clone}
     * 
     * @param {object} obj Objeto que se desea clonar.
     * 
     * @return {object} Devuelve una copia del objeto observable especificado.
     */
    this.cloneObservable = function (obj) {
        return komapping.fromJS(komapping.toJS(obj));
    };

    /**
     * @function
     * 
     * @description Reemplaza el contenido del tag con el selector especificado con el html provisto, luego hace un bind
     * del modelo contra los tags insertados. Permite en un solo paso cargar una vista parcial en un contenedor y bindear
     * dicha vista con un modelo.
     * 
     * @param {jquery-selector} placeholderSelector Selector de JQuery del tag cuyo contenido tiene que reemplazar
     * @param {string} html HTML con el que se debe reemplazar el contenido del tag seleccionado
     * @param {object} model Objeto al que se debe bindear el nuevo contenido
     */
    this.replaceAndBind = function (placeholderSelector, html, model) {
        placeholderSelector.html(html);
        ko.cleanNode(placeholderSelector.get(0));
        ko.applyBindings(model, placeholderSelector.get(0));
    };

    /**
     * @function 
     * 
     * @description Bloquea el uso del contenido de un elemento HTML. Se superpone un mensaje que rodea al elemento especificado que impide
     * que el usuario pueda interactuar y puede opcionalmente mostrar un mensaje. Util para bloquear al usuario cuando se esta
     * haciendo un post o procesamiento de algun formulario. Se debe desbloquear usando unblock
     * 
     * @see {@link bpba-utils:utils#unblock}
     * 
     * @param {jquery-selector} target Selector de JQuery del tag que se desea bloquear. Si se especifica vacio '' se bloquea toda la pantalla
     * @param {string} message Mensaje a mostrar en el tag mientras se encuentra bloqueado
     */
    this.block = function (target, message) {
        if (!message)
            message = 'Procesando...';

        var options = {
            message: message,
            css: {
                border: 'none',
                padding: '5px',
                backgroundColor: '#000',
                '-webkit-border-radius': '5px',
                '-moz-border-radius': '5px',
                opacity: .7,
                color: '#fff'
            },
            baseZ: 5000
        };

        if (target) {
            $(target).block(options);
        } else {
            $.blockUI(options);
        }
    };

    /**
     * @function
     * 
     * @description Desbloquea un elemento bloqueado previamente con el comando block.
     * 
     * @param {jquery-selector} target Selector del elemento a desbloquear. Especificarlo vacio '' o sin definir si se desea desbloquear toda la pantalla
     * 
     * @see {@link bpba-utils:utils#block}
     */
    this.unblock = function (target) {
        if (target) {
            $(target).unblock();
        } else {
            $.unblockUI();
        }
    };

    /**
     * @function
     * 
     * @description Extrae el valor del parametro especificado del querystring, o sea de los parametros especificados en la URL
     * a partir del caracter ?.
     * 
     * @param {string} name Nombre del parametro del que se quiere obtener el valor
     * 
     * @returns {string} Valor del parametro especificado.
     */
    this.getParam = function (name) {
        var result = undefined;
        var tmp = [];

        location.search
        .substr(1)
            .split("&")
            .forEach(function (item) {
                tmp = item.split("=");
                if (tmp[0] === name) result = decodeURIComponent(tmp[1]);
            });

        return result;
    };

    /**
     * @function
     * 
     * @description Devuelve verdadero si el parametro especificado es un string
     * 
     * @param {var} myVar Expresion que se debe verificar si es un string
     * 
     * @returns Verdadero si el valor especificado es un numero string
     */
    this.isString = function (myVar) {
        if (typeof myVar === 'string' || myVar instanceof String) {
            return true;
        }

        return false;
    };  
        
    /**
     * @function
     * 
     * @description Devuelve verdadero si el parametro especificado es un entero
     * 
     * @param {var} n Expresion que se debe verificar si es un entero
     * 
     * @returns Verdadero si el valor especificado es un numero entero
     */
    this.isInt = function (n) {
        return Number(n) === n && n % 1 === 0;
    };

    /**
     * @function
     * 
     * @description Devuelve verdadero si el parametro especificado es un numero
     * 
     * @param {var} n Expresion que se desea verificar que sea un numero
     * 
     * @returns Verdadero si el valor especificado es un numero
     */
    this.isNumeric = function (n) {
        return n === Number(n) && n % 1 !== 0;
    };

    /**
     * @function
     * 
     * @description Devuelve verdadero si el parametro especificado es una matriz
     * 
     * @param {var} variable Expresion que se desea verificar que sea una matriz
     * 
     * @returns Verdadero si el valor especificado es una matriz
     */
    this.isArray = function (variable) {
        return $.isArray(variable);
    };

    /**
     * @function
     * 
     * @description Devuelve verdadero si el parametro especificado es un objeto
     * 
     * @param {var} variable Expresion que se desea verificar si es un objeto
     * 
     * @returns Verdadero si el valor especificado es un objeto
     */
    this.isObject = function (variable) {
        if (variable !== null && typeof variable === 'object') {
            return true;
        }

        return false;
    };

    /**
     * @function
     * 
     * @description Devuelve verdadero si el parametro especificado es una funcion
     * 
     * @param {var} variable Expresion que se desea verificar si es un objeto
     * 
     * @returns Verdadero si el valor especificado es un objeto
     */
    this.isFunction = function (variable) {
        if (variable !== null && typeof variable === 'function') {
            return true;
        }

        return false;
    };

    /**
     * @function
     *
     * @description Devuelve verdadero si el parametro especificado es objeto de tipo fecha
     *
     * @param {variable} variable Expresion que se desea verificar si es un objeto fecha
     *
     * @returns Verdadero si el valor especificado es un objeto fecha
     */
    this.isDate = function(variable) {
        if (variable instanceof Date) {
            return true;
        }

        return false;
    }

    /**
     * @function
     *
     * @description Devuelve verdadero si el parametro especificado es objeto de tipo fecha valido
     *
     * @param {variable} variable Expresion que se desea verificar si es un objeto fecha valido
     *
     * @returns Verdadero si el valor especificado es un objeto fecha valido
     */
    this.isValidDate = function (variable) {
        if (!self.isDate(variable)) {
            return false;
        }

        if (isNaN(variable.getTime())) {
            return false;
        }

        return true;
    };

    /**
     * @function
     * 
     * @description Crea una cookie y almacena el valor especificado.
     * 
     * @param {string} cname Nombre de la cookie
     * @param {var} cvalue Valor que se desea almacenar en la cookie
     * @param {int} exSeconds Numero de segundos de validez de la cookie
     * 
     */
    this.setCookie = function (cname, cvalue, exSeconds) {
        var d = new Date();

        if (exSeconds !== undefined) {
            d.setTime(d.getTime() + (exSeconds * 1000));
            var expires = "expires=" + d.toUTCString();
            document.cookie = cname + "=" + cvalue + "; " + expires;
        } else {
            document.cookie = cname + "=" + cvalue + "; ";
        }
    };

    /**
     * @function
     * 
     * @description Lee el valor de la cookie especificada
     * 
     * @param {string} cname Nombre de la cookie especificada
     * 
     * @returns {string} Valor de la cookie especificada
     */
    this.getCookie = function (cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1);
            if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
        }
        return "";
    };

    /**
     * @function
     * 
     * @description Realiza un post de AJAX a la url especificada
     * 
     * @param {string} target URL a la que se hace el post
     * @param {Object} block Indica que elementos del Frontend se deben bloquear mientras se realiza esta operacion. 
     * Si se especifica null se bloquea toda la pantalla con el texto "Guardando..."
     * @param {jquery-selector} block.target Selector de JQuery con el tag a bloquear
     * @param {string} block.message Mensaje a mostrar mientras se bloquea el elemento
     * @param {bool} async Indica si el post se debe hacer sincronico o asincronico.
     * @param {bool} auth Indica si se debe enviar un header con el token de OAuth obtenido, esto sirve para consultar aquellos
     * servicios que requiren un usuario autorizado.
     * @param {string} method Metodo de post a utilizar (GET, POST, PUT, DELETE, OPTIONS)
     * @param {callback} onSuccess Funcion que se ejecuta cuando se pudo ejecutar correctamente el post en el servidor. 
     * Debe ser de la forma function(data) donde data es la respuesta que viene del servidor.
     * @param {callback} onError Funcion que se ejecuta cuando se produce un error al ejecutar el post. Si no se especifica ninguna
     * se verifica si el error proviene del servidor o se produjo en el cliente. En base a esto se recorre uno de los array de manejadores de 
     * error verificando si existe una funcion que pueda manejar el error, una vez encontrada se sale del metodo.
     * Si el error es del cliente se busca en clientErrorHandlers si viene del servidor se busca en serverErrorHandlers
     *
     * @see {@link bpba-utils:utils#clientErrorHandlers}
     * @see {@link bpba-utils:utils#serverErrorHandlers}
     */
    this.ajax = function (target, block, async, auth, method, data, onSuccess, onError) {
        var blockTarget = '';
        var blockMessage = 'Guardando...';

        if (self.isDefined(block) && block !== null) {
            if (self.isObject(block)) {
                if (self.isDefined(block['target'])) {
                    blockTarget = block.target;
                }
                if (self.isDefined(block['message'])) {
                    blockMessage = block.message;
                }
            } else {
                blockMessage = block;
            }

            self.block(blockTarget, blockMessage);
        }

        var headers = {};
        if (auth) {
            headers = {
                access_token: self.getCookie('token')
            };
        }

        $.ajax({
            url: target,
            type: method,
            cache: false,
            data: data,
            async: async,
            success: onSuccess,
            headers: headers,
            error: function (jqXHR, textStatus, errorThrown) {
                var manejado = false;

                if (self.isDefined(block) && block !== null) {
                    self.unblock(blockTarget);
                }

                if (self.isDefined(onError)) {
                    manejado = onError();
                }

                if (!manejado) {
                    if (jqXHR.status >= 500 && jqXHR.status < 600) {
                        for (handlerName in self.serverErrorHandlers) {
                            if (self.serverErrorHandlers[handlerName](target, JSON.parse(jqXHR.responseText))) {
                                manejado = true;
                                break;
                            }
                        }
                    } else {
                        for (handlerName in self.clientErrorHandlers) {
                            if (self.clientErrorHandlers[handlerName](target, jqXHR, textStatus, errorThrown)) {
                                manejado = true;
                                break;
                            }
                        }
                    }
                }
            }
        });
    };

    /**
     * @function
     * 
     * @description Devuelve el texto con los caracteres especiales codificados a formato HTML
     * 
     * @param {string} value Cadena a codificar en HTML
     * 
     * @returns {string} Cadena con los caracteres especiales codificados para HTML
     */        
    this.htmlEncode = function (value) {
        if (value) {
            return jQuery('<div />').text(value).html();
        } else {
            return '';
        }
    };

    /**
     * @function
     * 
     * @description Devuelve el texto con los caracteres especiales decodificados desde formato HTML
     * 
     * @param {string} value Cadena con formato HTML
     * 
     * @returns {string} Cadena con los caracteres especiales decodificados desde HTML
     */
    this.htmlDecode = function (value) {
        if (value) {
            return $('<div />').html(value).text();
        } else {
            return '';
        }
    };
    
    /**
     * @function
     * 
     * @description Limita el largo del string especificado, si el string supera
     * la longitud indicada se lo limita y se agrega puntos suspensivos al final
     * para indicar que el texto has sido truncado.
     * 
     * @param {string} value Cadena que se desea limitar
     * @param {integer} limit Limite total en cantidad de caracteres (incluidos los puntos suspensivos)
     * @returns {String} String limitado al tamaño especificado.
     */
    this.limitText = function (value, limit) {
        if (!self.isInt(limit)) {
            limit = 6;
        } else {
            if (limit < 6) {
                limit = 6;
            }
        }
        
        if (self.isString(value)) {            
            if (value.length > limit) {
                value = value.substr(0, limit - 3) + '...';
            }

            return value;
        } else {
            return '';
        }
    };
    
    this.components = function(params, object, callback) {
        object.childs = {};
        for (var name in params) {
            object['childs'][name] = {};
            object['childs'][name]['load'] = function(propertyName, vm) {                
                object[propertyName](vm);
                object['childs'][propertyName]['loaded'] = true;
                
                if (self.isDefined(vm['childs'])) {
                    object['childs'][propertyName]['ready'] = false;
                    
                    vm.parent = object;
                    vm.parentState = object['childs'][propertyName];
                } else {
                    object['childs'][propertyName]['ready'] = true;
                    
                    if (self.isDefined(vm['ready'])) {
                        vm['ready']();
                    }
                }
                                
                for (var property in params) {
                    if (!object['childs'][property]['loaded']) {
                        return;
                    }
                }
                
                for (var property in params) {
                    if (!object['childs'][property]['ready']) {
                        return;
                    }
                }
                
                if (self.isDefined(callback)) {
                    callback();
                }
                
                if (self.isFunction(object['ready'])) {
                    object['ready']();
                }

                if (self.isDefined(object['parent'])) {
                    object.parentState['ready'] = true;
                    object.parent.childReady();
                }                
            };
            
            object['childs'][name]['loaded'] = false;
            object.childReady = function() {
                for (var property in params) {
                    if (!object['childs'][property]['ready']) {
                        return;
                    }
                }

                if (self.isDefined(callback)) {
                    callback();
                }                              
                
                if (self.isFunction(object['ready'])) {
                    object['ready']();
                }
                
                if (self.isDefined(object['parent'])) {
                    object.parentState['ready'] = true;
                    object.parent.childReady();                    
                }                                
            };
            object[name] = params[name];
        }
    };
    
    this.config = function(config, values, object) {
        if (!self.isDefined(values)) {
            throw 'Debe especificar el array con los valores enviados como parametros en la llamada al metodo parameters de quark';
        }

        if (!self.isDefined(object)) {
            throw 'Debe especificar el array con los valores enviados como parametros en la llamada al metodo parameters de quark';
        }

        if (!self.isDefined(object['config'])) {
            object.config = {};
        }

        for (var name in config) {
            object.config[name] = config[name];

            if (ko.isObservable(object.config[name])) {
                console.warn('Cuidado! La propiedad ' + name + ' del objeto no deberia ser observable ya que el componente no deberia reaccionar si se cambia una vez creado. Para esto puede usar parameters');
            }

            if (self.isDefined(values[name])) {
                if (ko.isObservable(values[name])) {
                    object.config[name] = values[name]();
                } else {
                    object.config[name] = values[name];
                }
            }
        }
    };


    this.parameters = function(params, values, object) {
        if (!self.isDefined(values)) {
            throw 'Debe especificar el array con los valores enviados como parametros en la llamada al metodo parameters de quark';
        }

        if (!self.isDefined(object)) {
            throw 'Debe especificar el array con los valores enviados como parametros en la llamada al metodo parameters de quark';
        }

        for (var name in params) {
            object[name] = params[name];
            
            if (self.isDefined(values[name])) {
                if (ko.isObservable(object[name]) && ko.isObservable(values[name])) {
                    if (!ko.isComputed(object[name])) {
                        object[name] = values[name];
                    }
                } else if (ko.isObservable(object[name]) && !ko.isObservable(values[name])) {
                    object[name](values[name]);
                } else if (!ko.isObservable(object[name]) && ko.isObservable(values[name])) {
                    object[name] = values[name]();
                } else if (!ko.isObservable(object[name]) && !ko.isObservable(values[name])) {
                    if (!self.isFunction(object[name])) {
                        object[name] = values[name];
                    } else {
                        if (self.isFunction(values[name])) {
                            object[name] = values[name];
                        } else {
                            console.warn('El parametro ' + name + ' es un callback por lo que debería especificar una funcion');
                        }
                    }
                }
            }            
        }
    };

    /**
     * @function
     * 
     * @description Injecta los valores de un objeto en otro. Recorre las propiedades del objeto origen y las copias en aquellas
     * con el mismo nombre del objeto destino.
     * 
     * @param {object} from Objeto origen desde el que se quieren extraer los valores
     * @param {object} to Objeto destino al que se quieren copiar los valores
     */
    this.inject = function (from, to) {
        if (!self.isDefined(from)) {
            return;
        }
        
        if (!self.isDefined(to)) {
            return;
        }
        
        for (var name in from) {
            if (self.isDefined(to[name])) {
                var value;

                if (ko.isObservable(from[name])) {
                    value = from[name]();
                } else {
                    value = from[name];
                }

                if (ko.isObservable(to[name])) {
                    to[name](value);
                } else {
                    to[name] = value;
                }
            }
        }
    };

    /**
     * @function
     *
     * @description Genera un objeto fecha con el parametro especificado.
     * Si el parametro no representa una fecha coherente y no se especifico que devulva null devuelve la fecha de hoy.
     * Si se especifico que devuelva null y el parametro no representa una fecha coherente devuelve null.
     *
     * @param {value} Objeto a partir del cual obtener una fecha
     * @param {returnUndefined} Indica si se debe devolver nulo si no se puede transformar el parametro en una fecha valida.
     *
     * @returns Objeto fecha generado a partir del parametro especificado
     */
    this.makeDate = function (value, returnUndefined) {
        if (!self.isDate(value)) {
            value = new Date(value);
        }

        if (!self.isValidDate(value)) {
            if (!returnUndefined) {
                value = new Date();
            } else {
                return undefined;
            }
        }

        return value;
    }

    /**
     * @function
     * 
     * @description Verifica si el callback especificado esta definido lo invoca pasandole los parametros especificados
     * 
     * @param {callback} callback Callback a invocar        
     */
    this.call = function (callback) {
        if (self.isDefined(callback)) {
            var args = Array.prototype.slice.call(arguments, 1);
            return callback.apply(args);
        }

        return true;
    };

}

// This runs when the component is torn down. Put here any logic necessary to clean up,
// for example cancelling setTimeouts or disposing Knockout subscriptions/computeds.
$$.prototype.dispose = function () { };
